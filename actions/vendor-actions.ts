"use server";

import { revalidatePath } from "next/cache";
import { CONTROLS, EVI_TYPES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { authorize, type ActionResult } from "@/lib/session";

/** Starts a new cycle for a vendor. Nothing is copied or archived — older cycles stay as
 * they were, and the vendor's status is derived from whichever cycle is newest. */
export async function sendVendorRequest(
  vendorId: number,
  controls: string[],
  evidenceTypes: string[],
  due: string
): Promise<ActionResult> {
  const auth = await authorize("vendors");
  if ("ok" in auth) return auth;
  const controlsSent = CONTROLS.filter((c) => controls.includes(c));
  const evidenceRequested = EVI_TYPES.filter((e) => evidenceTypes.includes(e));
  if (controlsSent.length === 0) return { ok: false, error: "Select at least one control" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return { ok: false, error: "Pick a due date" };

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return { ok: false, error: "That vendor no longer exists" };
  const latest = await prisma.vendorRequest.findFirst({ where: { vendorId }, orderBy: { sentOn: "desc" } });
  if (latest && latest.status !== "Completed") return { ok: false, error: `${vendor.name} already has a request in progress` };

  const questions = await prisma.question.findMany({ where: { control: { in: controlsSent } } });
  await prisma.vendorRequest.create({
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
  revalidatePath("/", "layout");
  return { ok: true };
}

/** No email delivery yet — this only checks the request is still open. */
export async function sendReminder(requestId: number): Promise<ActionResult> {
  const auth = await authorize("vendors");
  if ("ok" in auth) return auth;
  const r = await prisma.vendorRequest.findUnique({ where: { id: requestId } });
  if (!r) return { ok: false, error: "That request no longer exists" };
  if (r.status === "Completed") return { ok: false, error: "This request is already completed" };
  return { ok: true };
}
