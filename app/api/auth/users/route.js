import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { listUsers, createUser, ensureUsersImported } from "@/lib/db/users";

export async function GET() {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  try {
    await ensureUsersImported();
    const users = await listUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id,
        username: u.username,
        name: u.name,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt,
        createdBy: u.createdBy,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json().catch(() => ({}));
  try {
    const user = await createUser({ ...body, createdBy: session.username });
    return NextResponse.json({ ok: true, user: { id: user._id, username: user.username, name: user.name, role: user.role } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
