import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession, getConfiguredUsers } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const users = getConfiguredUsers().map((u) => ({ username: u.username, name: u.name, role: u.role }));
  return NextResponse.json({ users });
}
