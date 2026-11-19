"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { SCHEMA, type EntityKey, type FormValues } from "@/lib/schema";
import { authorize, type ActionResult } from "@/lib/session";

/** The most human-readable field a record has, for the activity log. */
function labelFor(data: Record<string, unknown>): string {
  return (data.name as string) || (data.title as string) || (data.q as string) || "this record";
}

/** Keep only the schema's own (storable) fields; blank optional values become null. */
function pickFields(entity: EntityKey, values: FormValues, editing: boolean): Record<string, string | string[] | null> {
  const out: Record<string, string | string[] | null> = {};
  for (const f of SCHEMA[entity].fields) {
    if (f.t === "file") continue;
    if (f.editOnly && !editing) {
      if (f.def) out[f.k] = f.def;
      continue;
    }
    const v = values[f.k];
    if (f.t === "checklist") out[f.k] = Array.isArray(v) ? v : [];
    else out[f.k] = typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  }
  return out;
}

function delegate(entity: EntityKey) {
  return {
    answers: prisma.trustAnswer,
    evidence: prisma.evidenceItem,
    team: prisma.teamMember,
    vendors: prisma.vendor,
    issues: prisma.issue,
  }[entity] as unknown as {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    update(args: { where: { id: number }; data: Record<string, unknown> }): Promise<unknown>;
    delete(args: { where: { id: number } }): Promise<unknown>;
    findUnique(args: { where: { id: number } }): Promise<Record<string, unknown> | null>;
  };
}

export async function saveRecord(entity: EntityKey, editingId: number | null, values: FormValues): Promise<ActionResult> {
  const schema = SCHEMA[entity];
  const auth = await authorize(schema.area);
  if ("ok" in auth) return auth;

  const data: Record<string, unknown> = pickFields(entity, values, editingId != null);
  for (const f of schema.fields) {
    const v = data[f.k];
    if (f.req && (v == null || (Array.isArray(v) && v.length === 0))) return { ok: false, error: `Fill in "${f.l}"` };
  }

  if (entity === "team") {
    data.email = String(data.email).toLowerCase();
    if (editingId === auth.id && (data.role !== auth.role || data.status !== "Active")) {
      return { ok: false, error: "You can't change your own role or status" };
    }
    if (!editingId) data.inviteToken = randomBytes(24).toString("hex");
  }

  // Each approver sign-off change gets its own activity-log line, by role — the actual
  // audit trail for who approved what and when, rather than a generic "vendor updated".
  const priorSignoffs =
    entity === "vendors" && editingId
      ? ((await delegate(entity).findUnique({ where: { id: editingId } }))?.approverSignoffs as string[] | undefined) ?? []
      : [];

  try {
    if (editingId) await delegate(entity).update({ where: { id: editingId }, data });
    else await delegate(entity).create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Someone with that email is already on the team" };
    }
    throw e;
  }

  if (entity === "vendors") {
    const newSignoffs = (data.approverSignoffs as string[] | undefined) ?? [];
    for (const role of newSignoffs.filter((r) => !priorSignoffs.includes(r))) {
      await logActivity("vendors", `approved as ${role}`, labelFor(data), auth.name);
    }
    for (const role of priorSignoffs.filter((r) => !newSignoffs.includes(r))) {
      await logActivity("vendors", `revoked sign-off as ${role}`, labelFor(data), auth.name);
    }
  }

  await logActivity(entity, editingId ? "updated" : "created", labelFor(data), auth.name);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteRecord(entity: EntityKey, id: number): Promise<ActionResult> {
  const auth = await authorize(SCHEMA[entity].area);
  if ("ok" in auth) return auth;
  if (entity === "team" && id === auth.id) return { ok: false, error: "You can't remove yourself" };
  const row = await delegate(entity).findUnique({ where: { id } });
  await delegate(entity).delete({ where: { id } });
  await logActivity(entity, "deleted", row ? labelFor(row) : "this record", auth.name);
  revalidatePath("/", "layout");
  return { ok: true };
}
