import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getRevenueSnapshotsCollection } from "@/lib/db/collections";

export async function GET(request) {
  const session = await requireRole(["Admin", "Payroll Manager", "Viewer"]);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const property = searchParams.get("property");

  try {
    const collection = await getRevenueSnapshotsCollection();

    // Latest snapshot per property = group by property, take the one with
    // the newest uploadedAt. Cheap at this data volume to do in an
    // aggregation rather than fetching everything and reducing in JS.
    const pipeline = [
      ...(property && property !== "All Locations" ? [{ $match: { property } }] : []),
      { $sort: { uploadedAt: -1 } },
      { $group: { _id: "$property", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ];

    const snapshots = await collection.aggregate(pipeline).toArray();
    return NextResponse.json({ snapshots });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
