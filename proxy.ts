import { NextResponse, type NextRequest } from "next/server";

// Must match SESSION_COOKIE in lib/session.ts (proxy shouldn't import server modules).
const SESSION_COOKIE = "bison_vendor_session";
const PUBLIC_PATHS = ["/sign-in", "/invite", "/sign-up"];

/** Optimistic check only: no cookie → sign-in. The console layout verifies the session
 * against the database, and every server action re-checks it. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return NextResponse.next();
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|ico)$).*)"],
};
