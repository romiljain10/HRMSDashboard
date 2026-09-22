import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { parseRevenueUpload } from "@/lib/revenue/parseUpload";
import { getRevenueSnapshotsCollection } from "@/lib/db/collections";

export async function POST(request) {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { rows, errors } = parseRevenueUpload(buffer);

  if (errors.length > 0) {
    return NextResponse.json(
      { error: "This file has validation errors — nothing was saved.", details: errors },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data rows found in this file." }, { status: 400 });
  }

  const now = new Date();
  const documents = rows.map((row) => ({
    ...row,
    uploadedBy: session.username,
    uploadedAt: now,
    sourceFileName: file.name || "upload.xlsx",
  }));

  try {
    const collection = await getRevenueSnapshotsCollection();
    const result = await collection.insertMany(documents);
    return NextResponse.json({
      ok: true,
      inserted: result.insertedCount,
      properties: [...new Set(rows.map((r) => r.property))],
    });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
