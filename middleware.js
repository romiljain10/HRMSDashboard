import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, expectedSessionValue } from "@/lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always allow the login page itself and the auth API routes.
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const expected = await expectedSessionValue();
  // If no ADMIN_PASSWORD is configured, fail open with a console warning
  // rather than locking the operator out entirely — but this should be set
  // before sharing the URL with anyone else.
  if (!expected) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
