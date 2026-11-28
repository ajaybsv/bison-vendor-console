"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { EVI_TYPES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { authorize, type ActionResult } from "@/lib/session";
import { VENDOR_EVAL_DOMAINS } from "@/lib/vendor-evaluation";

/** Starts a new cycle for a vendor. Nothing is copied or archived — older cycles stay as
 * they were, and the vendor's status is derived from whichever cycle is newest. */
export async function sendVendorRequest(
  vendorId: number,
  domains: string[],
  evidenceTypes: string[],
  due: string
): Promise<ActionResult> {
  const auth = await authorize("vendors");
  if ("ok" in auth) return auth;
  const { db } = auth;
  const controlsSent = VENDOR_EVAL_DOMAINS.filter((c) => domains.includes(c));
  const evidenceRequested = EVI_TYPES.filter((e) => evidenceTypes.includes(e));
  if (controlsSent.length === 0) return { ok: false, error: "Select at least one domain" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return { ok: false, error: "Pick a due date" };

  const vendor = await db.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return { ok: false, error: "That vendor no longer exists" };
  const latest = await db.vendorRequest.findFirst({ where: { vendorId }, orderBy: { sentOn: "desc" } });
  if (latest && latest.status !== "Completed") return { ok: false, error: `${vendor.name} already has a request in progress` };

  const questions = await db.question.findMany({ where: { control: { in: controlsSent }, audience: "vendor" } });
  await db.vendorRequest.create({
    data: {
      vendorId,
      vendorName: vendor.name,
      status: "Awaiting response",
      cadence: vendor.cadence,
      controlsSent,
      qTotal: questions.length,
      evidenceRequested,
      evTotal: evidenceRequested.length,
      sentOn: todayISO(),
      due,
      responses: { create: questions.map((q) => ({ questionId: q.id })) },
      evidence: { create: evidenceRequested.map((type) => ({ type })) },
    },
  });
  await logActivity(db, "vendors", "sent request", vendor.name, auth.name);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** No email delivery yet — this only checks the request is still open. */
export async function sendReminder(requestId: number): Promise<ActionResult> {
  const auth = await authorize("vendors");
  if ("ok" in auth) return auth;
  const r = await auth.db.vendorRequest.findUnique({ where: { id: requestId } });
  if (!r) return { ok: false, error: "That request no longer exists" };
  if (r.status === "Completed") return { ok: false, error: "This request is already completed" };
  return { ok: true };
}

/** Records what the vendor told us for one question — entered by TPRM from the vendor's reply
 * (email, call, portal of theirs), not answered by the vendor directly in BISON. */
export async function recordVendorResponse(requestId: number, questionId: string, value: string): Promise<ActionResult> {
  const auth = await authorize("vendors");
  if ("ok" in auth) return auth;
  const { db } = auth;
  if (!value.trim()) return { ok: false, error: "Add the vendor's answer before recording it" };
  const r = await db.vendorRequest.findUnique({ where: { id: requestId } });
  if (!r) return { ok: false, error: "That request no longer exists" };
  if (r.status === "Completed") return { ok: false, error: "This request is already completed" };
  const question = await db.question.findUnique({ where: { id: questionId } });
  if (!question) return { ok: false, error: "Unknown question" };
  if (question.type === "choice" && !question.options.includes(value)) return { ok: false, error: "Pick one of the options" };

  const existing = await db.vendorResponse.findUnique({ where: { requestId_questionId: { requestId, questionId } } });
  await db.vendorResponse.upsert({
    where: { requestId_questionId: { requestId, questionId } },
    create: { requestId, questionId, value: value.trim(), confirmed: true },
    update: { value: value.trim(), confirmed: true },
  });
  if (!existing?.confirmed) {
    await db.vendorRequest.update({ where: { id: requestId }, data: { qDone: { increment: 1 } } });
  }
  revalidatePath(`/${auth.tenantSlug}/sent-requests/${requestId}`);
  return { ok: true };
}
