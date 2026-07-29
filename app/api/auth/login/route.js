import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, findUser, signSession, getConfiguredUsers } from "@/lib/auth";

export async function POST(request) {
  const { username, password } = await request.json().catch(() => ({}));

  if (getConfiguredUsers().length === 0) {
    return NextResponse.json(
      { error: "No users are configured on the server (set USERS_JSON or ADMIN_PASSWORD)." },
      { status: 500 }
    );
  }

  const user = findUser(username, password);
  if (!user) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const sessionValue = await signSession({ username: user.username, name: user.name, role: user.role });
  const res = NextResponse.json({ ok: true, user: { username: user.username, name: user.name, role: user.role } });
  res.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
