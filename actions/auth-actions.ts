"use server";

import { redirect } from "next/navigation";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createSession, deleteSession, type ActionResult } from "@/lib/session";
import { dbForTenant } from "@/lib/tenant-db";

export async function signIn(tenantSlug: string, email: string, password: string): Promise<ActionResult> {
  if (!email.trim() || !password) return { ok: false, error: "Enter an email and password" };
  const db = await dbForTenant(tenantSlug);
  if (!db) return { ok: false, error: "This workspace isn't available right now" };
  const member = await db.teamMember.findUnique({ where: { email: email.trim().toLowerCase() } });
  const valid = member?.passwordHash ? await verifyPassword(password, member.passwordHash) : false;
  if (!member || !valid) return { ok: false, error: "That email and password don't match" };
  if (member.status !== "Active") return { ok: false, error: "This account isn't active" };
  await createSession(tenantSlug, db, member.id);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const tenantSlug = await deleteSession();
  redirect(tenantSlug ? `/${tenantSlug}/sign-in` : "/");
}

/** Accepting an invite: set the name and password, mark the member Active, sign them in. */
export async function completeSignup(
  tenantSlug: string,
  token: string,
  name: string,
  password: string,
  confirm: string
): Promise<ActionResult> {
  if (!password || !confirm) return { ok: false, error: "Set a password" };
  if (password !== confirm) return { ok: false, error: "Passwords don't match" };
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters" };
  const db = await dbForTenant(tenantSlug);
  if (!db) return { ok: false, error: "This workspace isn't available right now" };
  const member = await db.teamMember.findFirst({ where: { inviteToken: token, status: "Invited" } });
  if (!member) return { ok: false, error: "This invite link is no longer valid" };
  await db.teamMember.update({
    where: { id: member.id },
    data: {
      name: name.trim() || member.name,
      passwordHash: await hashPassword(password),
      status: "Active",
      inviteToken: null,
    },
  });
  await createSession(tenantSlug, db, member.id);
  return { ok: true };
}
