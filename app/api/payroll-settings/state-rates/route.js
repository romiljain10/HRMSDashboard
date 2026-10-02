import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getStateBurdenRatesCollection } from "@/lib/db/collections";
import { US_STATES } from "@/lib/payroll/usStates";

export async function GET() {
  const session = await requireRole(["Admin", "Payroll Manager", "Viewer"]);
  if (session instanceof NextResponse) return session;

  try {
    const collection = await getStateBurdenRatesCollection();
    const rates = await collection.find({}).sort({ state: 1 }).toArray();
    return NextResponse.json({ rates });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json().catch(() => ({}));
  const { state, burdenPct } = body;

  if (!US_STATES.includes(state)) {
    return NextResponse.json({ error: "Unrecognized state." }, { status: 400 });
  }
  const parsedPct = Number(burdenPct);
  if (Number.isNaN(parsedPct) || parsedPct < 0 || parsedPct > 100) {
    return NextResponse.json({ error: "burdenPct must be a number between 0 and 100." }, { status: 400 });
  }

  try {
    const collection = await getStateBurdenRatesCollection();
    await collection.updateOne(
      { state },
      { $set: { state, burdenPct: parsedPct, updatedBy: session.username, updatedAt: new Date() } },
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
  const state = searchParams.get("state");
  if (!state) return NextResponse.json({ error: "state query param is required." }, { status: 400 });

  try {
    const collection = await getStateBurdenRatesCollection();
    await collection.deleteOne({ state });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
