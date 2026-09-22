import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/session";
import { getReportSubscriptionsCollection } from "@/lib/db/collections";

function parseId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export async function PATCH(request, { params }) {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const objectId = parseId(id);
  if (!objectId) return NextResponse.json({ error: "Invalid subscription id." }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Body must include a boolean 'active' field." }, { status: 400 });
  }

  try {
    const collection = await getReportSubscriptionsCollection();
    const result = await collection.updateOne({ _id: objectId }, { $set: { active: body.active } });
    if (result.matchedCount === 0) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const objectId = parseId(id);
  if (!objectId) return NextResponse.json({ error: "Invalid subscription id." }, { status: 400 });

  try {
    const collection = await getReportSubscriptionsCollection();
    const result = await collection.deleteOne({ _id: objectId });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
