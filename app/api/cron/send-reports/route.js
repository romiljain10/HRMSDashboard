import { NextResponse } from "next/server";
import { getReportSubscriptionsCollection } from "@/lib/db/collections";
import { getPayrollDataset, getPayrollTrend } from "@/services/bamboo/payrollService";
import { buildReportRows } from "@/lib/reports/buildRows";
import { generateCSVBuffer, generateXLSXBuffer, slug } from "@/lib/reports/generateFile";
import { sendEmail } from "@/lib/email/resend";
import { REPORTS_CATALOG } from "@/lib/reports/catalog";

const HISTORICAL_KEYS = ["payroll-hours-schedule", "payroll-history-summary"];

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

// Last complete Mon–Sun week before today — matches the app's own default
// date-range logic, so a scheduled report covers the same period a person
// would see if they'd opened the app that day.
function lastCompleteWeek(now) {
  const day = now.getDay();
  const diffToThisMonday = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + diffToThisMonday);
  thisMonday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  return {
    start: lastMonday.toISOString().slice(0, 10),
    end: lastSunday.toISOString().slice(0, 10),
  };
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
  const { start, end } = lastCompleteWeek(now);

  // Fetch each data source at most once per run, reused across every due
  // subscription rather than re-fetched per email.
  let dataset = null;
  let trend = null;

  for (const sub of subscriptions) {
    if (!isDueToday(sub, now)) {
      results.skipped += 1;
      continue;
    }

    try {
      const report = REPORTS_CATALOG.find((r) => r.key === sub.reportKey);
      if (!report) throw new Error(`Unknown report key: ${sub.reportKey}`);

      const isHistorical = HISTORICAL_KEYS.includes(sub.reportKey);
      if (isHistorical && !trend) {
        trend = await getPayrollTrend({ end, weeks: 13 });
      }
      if (!dataset) {
        dataset = await getPayrollDataset({ start, end });
      }

      const weeklyTotals = isHistorical
        ? trend.weeks.map((w) => {
            const sum = (key) => w.employeeCosts.reduce((s, e) => s + (e[key] || 0), 0);
            return {
              weekLabel: w.weekLabel,
              weekStart: w.weekStart,
              regularHours: Math.round(sum("regularHours") * 100) / 100,
              otHours: Math.round(sum("otHours") * 100) / 100,
              holidayHours: Math.round(sum("holidayHours") * 100) / 100,
              totalCost: Math.round(sum("totalCost") * 100) / 100,
            };
          })
        : undefined;

      const { columns, rows } = buildReportRows(sub.reportKey, dataset, weeklyTotals);

      const buffer = sub.format === "CSV" ? generateCSVBuffer(columns, rows) : generateXLSXBuffer(columns, rows);
      const ext = sub.format === "CSV" ? "csv" : "xlsx";

      await sendEmail({
        to: sub.recipients,
        subject: `${report.name} — ${start} to ${end}`,
        html: `<p>Attached: <strong>${report.name}</strong> for the period ${start} to ${end}.</p><p>Sent automatically by your HR dashboard's report scheduler.</p>`,
        attachment: { filename: `${slug(report.name)}.${ext}`, buffer },
      });

      await collection.updateOne({ _id: sub._id }, { $set: { lastSentAt: now } });
      results.sent.push({ id: sub._id, reportKey: sub.reportKey, recipients: sub.recipients });
    } catch (err) {
      results.failed.push({ id: sub._id, reportKey: sub.reportKey, error: err.message });
    }
  }

  return NextResponse.json(results);
}
