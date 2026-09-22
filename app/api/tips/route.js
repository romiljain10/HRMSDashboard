import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getTipsCollection } from "@/lib/db/collections";

export async function GET(request) {
  const session = await requireRole(["Admin", "Payroll Manager", "Viewer"]);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const property = searchParams.get("property");
  const weekStart = searchParams.get("weekStart");

  try {
    const collection = await getTipsCollection();
    const query = {};
    if (property && property !== "All Locations") query.property = property;
    if (weekStart) query.weekStart = weekStart;

    const tips = await collection.find(query).sort({ weekStart: -1 }).limit(50).toArray();
    return NextResponse.json({ tips });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json().catch(() => null);
  const { property, weekStart, weekEnd, amount } = body || {};

  if (!property || !weekStart || !weekEnd) {
    return NextResponse.json({ error: "Property, weekStart, and weekEnd are required." }, { status: 400 });
  }
  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json({ error: "Amount must be a non-negative number." }, { status: 400 });
  }

  try {
    const collection = await getTipsCollection();
    // Upsert on (property, weekStart) — re-entering the same week corrects
    // it in place rather than creating a duplicate/ambiguous second entry.
    // Unlike revenue_snapshots, tips don't need a full append-only audit
    // trail — one figure per property per week is the whole shape of it.
    await collection.updateOne(
      { property, weekStart },
      {
        $set: {
          property,
          weekStart,
          weekEnd,
          amount: parsedAmount,
          enteredBy: session.username,
          enteredAt: new Date(),
        },
      },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
