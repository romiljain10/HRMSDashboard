import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession, getConfiguredUsers } from "@/lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always allow the login page itself, the auth API routes, and the cron
  // endpoint — Vercel's cron trigger has no login session, only the
  // Authorization: Bearer CRON_SECRET header, which the route checks
  // itself. Without this exemption, every scheduled run would silently
  // get redirected to /login before ever reaching that check.
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth") || pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  // If no users are configured at all, fail open with a console warning
  // rather than locking the operator out entirely — but this should be set
  // before sharing the URL with anyone else.
  if (getConfiguredUsers().length === 0) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySession(cookie);
  if (session?.username) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
