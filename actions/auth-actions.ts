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

/** Bootstraps the very first account for a freshly-provisioned tenant — only works while the
 * tenant has no team members at all, so it can never be used to add a second account once the
 * workspace has a real owner (invite them from Team & access instead). */
export async function bootstrapFirstOwner(
  tenantSlug: string,
  name: string,
  email: string,
  password: string,
  confirm: string
): Promise<ActionResult> {
  if (!name.trim()) return { ok: false, error: "Enter your name" };
  if (!email.trim()) return { ok: false, error: "Enter your email" };
  if (!password || !confirm) return { ok: false, error: "Set a password" };
  if (password !== confirm) return { ok: false, error: "Passwords don't match" };
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters" };
  const db = await dbForTenant(tenantSlug);
  if (!db) return { ok: false, error: "This workspace isn't available right now" };
  const existing = await db.teamMember.count();
  if (existing > 0) return { ok: false, error: "This workspace already has an owner — sign in instead" };
  const member = await db.teamMember.create({
    data: { name: name.trim(), email: email.trim().toLowerCase(), role: "Owner", status: "Active", passwordHash: await hashPassword(password) },
  });
  await createSession(tenantSlug, db, member.id);
  return { ok: true };
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
