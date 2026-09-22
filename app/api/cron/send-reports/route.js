import { NextResponse } from "next/server";
import { getReportSubscriptionsCollection } from "@/lib/db/collections";
import { sendReportForSubscription, lastCompleteWeek } from "@/lib/reports/sendScheduledReport";

function isDueToday(sub, now) {
  // Never send twice in the same calendar day, regardless of schedule match.
  if (sub.lastSentAt) {
    const last = new Date(sub.lastSentAt);
    if (last.toDateString() === now.toDateString()) return false;
  }
  if (sub.frequency === "weekly") return now.getDay() === sub.dayOfWeek;
  if (sub.frequency === "monthly") return now.getDate() === sub.dayOfMonth;
  return false;
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const results = { sent: [], failed: [], skipped: 0 };

  let collection;
  try {
    collection = await getReportSubscriptionsCollection();
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }

  const subscriptions = await collection.find({ active: true }).toArray();

  for (const sub of subscriptions) {
    if (!isDueToday(sub, now)) {
      results.skipped += 1;
      continue;
    }

    try {
      await sendReportForSubscription(sub, { now });
      await collection.updateOne({ _id: sub._id }, { $set: { lastSentAt: now } });
      results.sent.push({ id: sub._id, reportKey: sub.reportKey, recipients: sub.recipients });
    } catch (err) {
      results.failed.push({ id: sub._id, reportKey: sub.reportKey, error: err.message });
    }
  }

  return NextResponse.json(results);
}
