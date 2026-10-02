import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getPropertyStatesCollection } from "@/lib/db/collections";
import { US_STATES } from "@/lib/payroll/usStates";

export async function GET() {
  const session = await requireRole(["Admin", "Payroll Manager", "Viewer"]);
  if (session instanceof NextResponse) return session;

  try {
    const collection = await getPropertyStatesCollection();
    const mappings = await collection.find({}).sort({ property: 1 }).toArray();
    return NextResponse.json({ mappings });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json().catch(() => ({}));
  const { property, state } = body;

  if (!property) return NextResponse.json({ error: "property is required." }, { status: 400 });
  if (!US_STATES.includes(state)) {
    return NextResponse.json({ error: "Unrecognized state." }, { status: 400 });
  }

  try {
    const collection = await getPropertyStatesCollection();
    await collection.updateOne(
      { property },
      { $set: { property, state, updatedBy: session.username, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const property = searchParams.get("property");
  if (!property) return NextResponse.json({ error: "property query param is required." }, { status: 400 });

  try {
    const collection = await getPropertyStatesCollection();
    await collection.deleteOne({ property });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
