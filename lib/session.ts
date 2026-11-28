import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { canEdit, type Area } from "@/lib/constants";
import { dbForTenant } from "@/lib/tenant-db";
import type { SessionContext, TenantDb } from "@/lib/types";

export const SESSION_COOKIE = "bison_vendor_session";
const SESSION_DAYS = 7;

/** Only a hash of the cookie token is stored, so a leaked sessions table can't be replayed. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cookie value is `{tenantSlug}:{token}` — the slug alone is never trusted for anything
 * beyond resolving which tenant's database the token itself needs to check out against. */
function splitCookie(value: string): { slug: string; token: string } | null {
  const i = value.indexOf(":");
  if (i < 0) return null;
  return { slug: value.slice(0, i), token: value.slice(i + 1) };
}

export async function createSession(tenantSlug: string, db: TenantDb, memberId: number): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await db.session.create({ data: { id: hashToken(token), memberId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, `${tenantSlug}:${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Returns the tenant slug the cleared session belonged to, if any — callers use it to send
 * the browser back to that tenant's own sign-in page. */
export async function deleteSession(): Promise<string | null> {
  const store = await cookies();
  const parsed = splitCookie(store.get(SESSION_COOKIE)?.value ?? "");
  if (parsed) {
    const db = await dbForTenant(parsed.slug);
    if (db) await db.session.deleteMany({ where: { id: hashToken(parsed.token) } });
  }
  store.delete(SESSION_COOKIE);
  return parsed?.slug ?? null;
}

/** The signed-in member plus their tenant's Prisma client, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionContext | null> => {
  const parsed = splitCookie((await cookies()).get(SESSION_COOKIE)?.value ?? "");
  if (!parsed) return null;
  const db = await dbForTenant(parsed.slug);
  if (!db) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(parsed.token) },
    include: { member: true },
  });
  if (!session || session.expiresAt < new Date() || session.member.status !== "Active") return null;
  const { id, name, email, role } = session.member;
  return { id, name, email, role, db, tenantSlug: parsed.slug };
});

/** For plain data-fetching that doesn't need the user, only their tenant's database —
 * e.g. lib/data.ts. Returns null outside of a signed-in request. */
export async function getCurrentDb(): Promise<TenantDb | null> {
  const ctx = await getCurrentUser();
  return ctx?.db ?? null;
}

/** For pages and layouts: bounce to this tenant's sign-in when there's no valid session,
 * or when the signed-in session belongs to a different tenant than the current URL. */
export async function requireUser(tenantSlug: string): Promise<SessionContext> {
  const ctx = await getCurrentUser();
  if (!ctx || ctx.tenantSlug !== tenantSlug) redirect(`/${tenantSlug}/sign-in`);
  return ctx;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/** For server actions: the member + their tenant's db if they may edit `area`, otherwise an
 * error result. */
export async function authorize(area: Area): Promise<SessionContext | { ok: false; error: string }> {
  const ctx = await getCurrentUser();
  if (!ctx) return { ok: false, error: "Your session has expired — sign in again" };
  if (!canEdit(ctx.role, area)) return { ok: false, error: `${ctx.role}s can't make this change` };
  return ctx;
}
