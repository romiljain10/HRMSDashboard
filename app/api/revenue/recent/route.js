import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getRevenueSnapshotsCollection } from "@/lib/db/collections";

export async function GET() {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  try {
    const collection = await getRevenueSnapshotsCollection();
    const recent = await collection
      .find({})
      .sort({ uploadedAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({ uploads: recent });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
