import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireRole } from "@/lib/session";
import { getReportSubscriptionsCollection } from "@/lib/db/collections";
import { sendReportForSubscription } from "@/lib/reports/sendScheduledReport";

export async function POST(request, { params }) {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid subscription id." }, { status: 400 });
  }

  try {
    const collection = await getReportSubscriptionsCollection();
    const sub = await collection.findOne({ _id: objectId });
    if (!sub) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });

    const result = await sendReportForSubscription(sub);
    await collection.updateOne({ _id: objectId }, { $set: { lastSentAt: new Date() } });

    return NextResponse.json({ ok: true, ...result, recipients: sub.recipients });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
