"use server";

import { revalidatePath } from "next/cache";
import { authorize, type ActionResult } from "@/lib/session";
import type { ClientRequest, TenantDb } from "@/lib/types";

async function openRequest(db: TenantDb, requestId: number): Promise<{ error: string } | { request: ClientRequest }> {
  const r = await db.clientRequest.findUnique({ where: { id: requestId } });
  if (!r) return { error: "That request no longer exists" };
  if (r.status === "Submitted") return { error: "This assessment has already been submitted" };
  return { request: r };
}

/** Confirm one answer in a client request. Saved to this request only — not the Trust Pack. */
export async function confirmWorkspaceAnswer(requestId: number, questionId: string, value: string): Promise<ActionResult> {
  const auth = await authorize("requests");
  if ("ok" in auth) return auth;
  const { db } = auth;
  if (!value.trim()) return { ok: false, error: "Add an answer before confirming" };
  const open = await openRequest(db, requestId);
  if ("error" in open) return { ok: false, error: open.error };
  const question = await db.question.findUnique({ where: { id: questionId } });
  if (!question) return { ok: false, error: "Unknown question" };
  if (question.type === "choice" && !question.options.includes(value)) return { ok: false, error: "Pick one of the options" };

  await db.workspaceAnswer.upsert({
    where: { requestId_questionId: { requestId, questionId } },
    create: { requestId, questionId, value: value.trim(), confirmed: true },
    update: { value: value.trim(), confirmed: true },
  });
  revalidatePath(`/${auth.tenantSlug}/requests/${requestId}`);
  return { ok: true };
}

export async function submitAssessment(requestId: number): Promise<ActionResult> {
  const auth = await authorize("requests");
  if ("ok" in auth) return auth;
  const { db } = auth;
  const open = await openRequest(db, requestId);
  if ("error" in open) return { ok: false, error: open.error };
  const r = open.request;
  await db.clientRequest.update({
    where: { id: requestId },
    data: { status: "Submitted", qDone: r.qTotal, evDone: r.evTotal },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
