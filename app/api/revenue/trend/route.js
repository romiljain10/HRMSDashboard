import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getRevenueSnapshotsCollection } from "@/lib/db/collections";

export async function GET(request) {
  const session = await requireRole(["Admin", "Payroll Manager", "Viewer"]);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const property = searchParams.get("property");
  const limit = Math.min(Number(searchParams.get("limit")) || 26, 100);

  try {
    const collection = await getRevenueSnapshotsCollection();

    // Same "latest per property per period" logic as /api/revenue/latest,
    // but across every period on file instead of just the newest one —
    // group by (property, periodStart), take the most recently uploaded
    // version of each, so a correction doesn't create a duplicate point
    // on the trend line.
    const pipeline = [
      ...(property && property !== "All Locations" ? [{ $match: { property } }] : []),
      { $sort: { uploadedAt: -1 } },
      { $group: { _id: { property: "$property", periodStart: "$periodStart" }, doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
      { $sort: { periodStart: -1 } },
      { $limit: limit },
    ];

    const snapshots = await collection.aggregate(pipeline).toArray();
    snapshots.reverse(); // oldest-first, for chronological chart display
    return NextResponse.json({ snapshots });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
