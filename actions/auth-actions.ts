"use server";

import { redirect } from "next/navigation";
import { verifyPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, type ActionResult } from "@/lib/session";

export async function signIn(email: string, password: string): Promise<ActionResult> {
  if (!email.trim() || !password) return { ok: false, error: "Enter an email and password" };
  const member = await prisma.teamMember.findUnique({ where: { email: email.trim().toLowerCase() } });
  const valid = member?.passwordHash ? await verifyPassword(password, member.passwordHash) : false;
  if (!member || !valid) return { ok: false, error: "That email and password don't match" };
  if (member.status !== "Active") return { ok: false, error: "This account isn't active" };
  await createSession(member.id);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect("/sign-in");
}

/** Accepting an invite: set the name and password, mark the member Active, sign them in. */
export async function completeSignup(
  token: string,
  name: string,
  password: string,
  confirm: string
): Promise<ActionResult> {
  if (!password || !confirm) return { ok: false, error: "Set a password" };
  if (password !== confirm) return { ok: false, error: "Passwords don't match" };
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters" };
  const member = await prisma.teamMember.findFirst({ where: { inviteToken: token, status: "Invited" } });
  if (!member) return { ok: false, error: "This invite link is no longer valid" };
  await prisma.teamMember.update({
    where: { id: member.id },
    data: {
      name: name.trim() || member.name,
      passwordHash: await hashPassword(password),
      status: "Active",
      inviteToken: null,
    },
  });
  await createSession(member.id);
  return { ok: true };
}
