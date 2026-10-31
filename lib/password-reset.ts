import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/** Only a hash of the emailed token is stored. */
export const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** The reset row for an unexpired, unused link belonging to an active member — or null. */
export async function findValidReset(token: string) {
  const reset = await prisma.passwordReset.findUnique({ where: { id: hashResetToken(token) }, include: { member: true } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.member.status !== "Active") return null;
  return reset;
}
