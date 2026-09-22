import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, findUser, signSession, getConfiguredUsers } from "@/lib/auth";
import { ensureUsersImported, findDbUser } from "@/lib/db/users";

export async function POST(request) {
  const { username, password } = await request.json().catch(() => ({}));

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  let user = null;

  // Database-backed accounts (self-service user management) are the
  // primary path. Falls back to the legacy env-based check if MongoDB
  // isn't reachable, so a database hiccup never locks everyone out.
  try {
    await ensureUsersImported();
    const dbUser = await findDbUser(username, password);
    if (dbUser) user = { username: dbUser.username, name: dbUser.name, role: dbUser.role };
  } catch {
    // Fall through to the legacy check below.
  }

  if (!user) {
    if (getConfiguredUsers().length === 0) {
      return NextResponse.json(
        { error: "No users are configured on the server (set USERS_JSON or ADMIN_PASSWORD)." },
        { status: 500 }
      );
    }
    const legacyUser = findUser(username, password);
    if (legacyUser) user = { username: legacyUser.username, name: legacyUser.name, role: legacyUser.role };
  }

  if (!user) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const sessionValue = await signSession(user);
  const res = NextResponse.json({ ok: true, user });
  res.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
