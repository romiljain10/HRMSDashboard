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

/**
 * Resolves the property a request is actually allowed to see, given the
 * session. If the session has no property restriction (property is
 * null/unset — Admins, Payroll Managers without a restriction, or legacy
 * env-based accounts), the requested property passes through unchanged.
 * If the session IS restricted to one property, that property is returned
 * regardless of what was requested — a restricted user asking for a
 * different property (whether through the UI or by calling the API
 * directly) silently gets their own property's data instead, not an
 * error and not someone else's data. This is the actual security
 * boundary; the frontend's locked dropdown is just a convenience on top
 * of this, not a substitute for it.
 */
export function resolveAllowedProperty(session, requestedProperty) {
  if (session?.property) return session.property;
  return requestedProperty;
}
