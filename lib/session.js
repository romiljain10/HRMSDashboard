import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";

/** Returns the current session, or null if not logged in. */
export async function getSession() {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

/**
 * Returns the session if it's logged in and has one of `allowedRoles`,
 * otherwise returns a ready-to-return NextResponse error — callers should
 * check `if (result instanceof NextResponse) return result;`.
 */
export async function requireRole(allowedRoles) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json(
      { error: `Requires one of: ${allowedRoles.join(", ")}.` },
      { status: 403 }
    );
  }
  return session;
}
