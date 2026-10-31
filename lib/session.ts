import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { canEdit, type Area } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/types";

export const SESSION_COOKIE = "bison_vendor_session";
const SESSION_DAYS = 7;

/** Only a hash of the cookie token is stored, so a leaked sessions table can't be replayed. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(memberId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await prisma.session.create({ data: { id: hashToken(token), memberId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

/** The signed-in member, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { member: true },
  });
  if (!session || session.expiresAt < new Date() || session.member.status !== "Active") return null;
  const { id, name, email, role } = session.member;
  return { id, name, email, role };
});

/** For pages and layouts: bounce to sign-in when there's no valid session. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/** For server actions: the member if they may edit `area`, otherwise an error result. */
export async function authorize(area: Area): Promise<CurrentUser | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired — sign in again" };
  if (!canEdit(user.role, area)) return { ok: false, error: `${user.role}s can't make this change` };
  return user;
}
