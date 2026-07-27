import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, sha256Hex } from "@/lib/auth";

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedPassword) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  if (!password || password !== expectedPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const sessionValue = await sha256Hex(expectedPassword);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
