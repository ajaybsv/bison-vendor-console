import { NextResponse, type NextRequest } from "next/server";

// Must match SESSION_COOKIE in lib/session.ts (proxy shouldn't import server modules).
const SESSION_COOKIE = "bison_vendor_session";
const PUBLIC_SEGMENTS = ["sign-in", "invite", "sign-up", "forgot-password", "reset-password"];

/** Optimistic check only: no cookie (or one for a different tenant) → this tenant's sign-in.
 * The console layout verifies the session against the right tenant's database, and every
 * server action re-checks it. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, tenant, section] = pathname.split("/");
  if (!tenant) return NextResponse.next();
  if (PUBLIC_SEGMENTS.includes(section)) return NextResponse.next();

  const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const cookieTenant = cookie.split(":")[0];
  if (cookieTenant !== tenant) {
    return NextResponse.redirect(new URL(`/${tenant}/sign-in`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
