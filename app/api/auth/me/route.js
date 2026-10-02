import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession, signSession } from "@/lib/auth";
import { updateOwnName } from "@/lib/db/users";

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user: session });
}

/**
 * Self-service profile edit — currently just the display name. Not
 * username, password, role, or property; those remain Admin-only via
 * the Team Access routes. Re-signs the session cookie with the new name
 * so the UI reflects it immediately, without requiring a re-login.
 */
export async function PATCH(request) {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "A 'name' field is required." }, { status: 400 });
  }

  let newName;
  try {
    newName = await updateOwnName(session.username, body.name);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const updatedSession = { ...session, name: newName };
  const sessionValue = await signSession(updatedSession);
  const res = NextResponse.json({ ok: true, user: updatedSession });
  res.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
