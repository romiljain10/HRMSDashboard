import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/session";
import { getUsersCollection } from "@/lib/db/collections";
import { countActiveAdmins } from "@/lib/db/users";
import { hashPassword, ROLES } from "@/lib/auth";

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function PATCH(request, { params }) {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const objectId = parseId(id);
  if (!objectId) return NextResponse.json({ error: "Invalid user id." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const collection = await getUsersCollection();
  const target = await collection.findOne({ _id: objectId });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const update = {};

  if (body.name !== undefined) update.name = body.name;

  if (body.role !== undefined) {
    if (!ROLES.includes(body.role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${ROLES.join(", ")}` }, { status: 400 });
    }
    if (target.role === "Admin" && body.role !== "Admin") {
      const remaining = await countActiveAdmins(objectId);
      if (remaining === 0) {
        return NextResponse.json({ error: "Can't demote the last remaining Admin — promote someone else first." }, { status: 400 });
      }
    }
    update.role = body.role;
  }

  if (body.active !== undefined) {
    if (target.role === "Admin" && body.active === false) {
      const remaining = await countActiveAdmins(objectId);
      if (remaining === 0) {
        return NextResponse.json({ error: "Can't deactivate the last remaining Admin." }, { status: 400 });
      }
    }
    if (String(target._id) === String(objectId) && target.username === session.username && body.active === false) {
      return NextResponse.json({ error: "You can't deactivate your own account." }, { status: 400 });
    }
    update.active = body.active;
  }

  if (body.password !== undefined) {
    if (!body.password || body.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    update.passwordHash = await hashPassword(body.password);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  try {
    await collection.updateOne({ _id: objectId }, { $set: update });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const objectId = parseId(id);
  if (!objectId) return NextResponse.json({ error: "Invalid user id." }, { status: 400 });

  const collection = await getUsersCollection();
  const target = await collection.findOne({ _id: objectId });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (target.username === session.username) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }
  if (target.role === "Admin") {
    const remaining = await countActiveAdmins(objectId);
    if (remaining === 0) {
      return NextResponse.json({ error: "Can't delete the last remaining Admin." }, { status: 400 });
    }
  }

  try {
    await collection.deleteOne({ _id: objectId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
