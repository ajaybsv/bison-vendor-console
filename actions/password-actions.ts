"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { passwordResetEmail, sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/password";
import { findValidReset, hashResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { createSession, type ActionResult } from "@/lib/session";

const RESET_MINUTES = 60;
const RESEND_COOLDOWN_MS = 60_000;

async function appOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Always reports success, so the form never reveals which emails have accounts. */
export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const address = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return { ok: false, error: "Enter a valid email address" };

  const member = await prisma.teamMember.findUnique({ where: { email: address } });
  // Active members without a password yet (e.g. added by migration) set their first one this way.
  if (!member || member.status !== "Active") return { ok: true };

  const recent = await prisma.passwordReset.findFirst({
    where: { memberId: member.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) return { ok: true };

  // Only the newest link is valid.
  await prisma.passwordReset.deleteMany({ where: { memberId: member.id, usedAt: null } });
  const token = randomBytes(32).toString("base64url");
  await prisma.passwordReset.create({
    data: { id: hashResetToken(token), memberId: member.id, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
  });

  const link = `${await appOrigin()}/reset-password/${token}`;
  try {
    await sendMail({ to: member.email, toName: member.name, ...passwordResetEmail(member.name, link) });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "We couldn't send the email right now — try again in a minute" };
  }
  return { ok: true };
}

/** Sets the new password, burns the link, signs out every other session and signs this one in. */
export async function resetPassword(token: string, password: string, confirm: string): Promise<ActionResult> {
  if (!password || !confirm) return { ok: false, error: "Set a password" };
  if (password !== confirm) return { ok: false, error: "Passwords don't match" };
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters" };
  const reset = await findValidReset(token);
  if (!reset) return { ok: false, error: "This reset link has expired or was already used" };

  await prisma.$transaction([
    prisma.teamMember.update({ where: { id: reset.memberId }, data: { passwordHash: await hashPassword(password) } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { memberId: reset.memberId } }),
  ]);
  await createSession(reset.memberId);
  return { ok: true };
}
