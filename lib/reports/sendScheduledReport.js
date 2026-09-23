import { getPayrollDataset, getPayrollTrend } from "@/services/bamboo/payrollService";
import { buildReportRows } from "@/lib/reports/buildRows";
import { generateCSVBuffer, generateXLSXBuffer, slug } from "@/lib/reports/generateFile";
import { sendEmail } from "@/lib/email/resend";
import { REPORTS_CATALOG } from "@/lib/reports/catalog";
import { getRevenueSnapshotsCollection, getTipsCollection } from "@/lib/db/collections";

const HISTORICAL_KEYS = ["payroll-hours-schedule", "payroll-history-summary"];

// Last complete Mon–Sun week before `now` — matches the app's own default
// date-range logic, so a report covers the same period a person would see
// if they'd opened the app that day.
export function lastCompleteWeek(now) {
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

/**
 * For revenue-reminder / tips-reminder subscriptions: checks which
 * properties are missing data for the given week and emails a nudge
 * listing them — no file attachment. Returns emailSent:false (without
 * sending anything) when every property already has data, so a quiet
 * week doesn't spam recipients with an empty reminder.
 */
async function sendReminder(sub, dataset, { start, end }) {
  const properties = [...new Set((dataset.employees ?? []).map((e) => e.location).filter(Boolean))];
  if (properties.length === 0) {
    return { start, end, reportName: sub.reportKey, emailSent: false, skippedReason: "No properties found." };
  }

  let missing;
  let subject;
  let bodyLabel;

  if (sub.reportKey === "revenue-reminder") {
    const collection = await getRevenueSnapshotsCollection();
    const entered = await collection.distinct("property", { periodStart: { $lte: end }, periodEnd: { $gte: start } });
    missing = properties.filter((p) => !entered.includes(p));
    subject = `Revenue not yet entered — ${start} to ${end}`;
    bodyLabel = "revenue data";
  } else {
    const collection = await getTipsCollection();
    const entered = await collection.distinct("property", { weekStart: start });
    missing = properties.filter((p) => !entered.includes(p));
    subject = `Tips not yet entered — ${start} to ${end}`;
    bodyLabel = "tips";
  }

  if (missing.length === 0) {
    return { start, end, reportName: sub.reportKey, emailSent: false, skippedReason: `All properties already have ${bodyLabel} entered.` };
  }

  await sendEmail({
    to: sub.recipients,
    subject,
    html: `<p>The following properties are missing ${bodyLabel} for ${start} to ${end}:</p><ul>${missing.map((p) => `<li>${p}</li>`).join("")}</ul><p>Enter it on the Revenue page of your HR dashboard.</p>`,
  });

  return { start, end, reportName: sub.reportKey, emailSent: true, missing };
}

/**
 * Builds the report for one subscription and emails it. Throws on any
 * failure (unknown report, BambooHR error, Resend error) — callers decide
 * how to handle that (cron continues to the next subscription; a manual
 * "Send Now" surfaces it directly to the user).
 */
export async function sendReportForSubscription(sub, { now = new Date() } = {}) {
  const report = REPORTS_CATALOG.find((r) => r.key === sub.reportKey);
  if (!report) throw new Error(`Unknown report key: ${sub.reportKey}`);

  const { start, end } = lastCompleteWeek(now);
  const isHistorical = HISTORICAL_KEYS.includes(sub.reportKey);

  const dataset = await getPayrollDataset({ start, end });

  if (report.isReminder) {
    return sendReminder(sub, dataset, { start, end });
  }

  let weeklyTotals;
  if (isHistorical) {
    const trend = await getPayrollTrend({ end, weeks: 13 });
    weeklyTotals = trend.weeks.map((w) => {
      const sum = (key) => w.employeeCosts.reduce((s, e) => s + (e[key] || 0), 0);
      return {
        weekLabel: w.weekLabel,
        weekStart: w.weekStart,
        regularHours: Math.round(sum("regularHours") * 100) / 100,
        otHours: Math.round(sum("otHours") * 100) / 100,
        holidayHours: Math.round(sum("holidayHours") * 100) / 100,
        totalCost: Math.round(sum("totalCost") * 100) / 100,
      };
    });
  }

  const { columns, rows } = buildReportRows(sub.reportKey, dataset, weeklyTotals);

  const buffer = sub.format === "CSV" ? generateCSVBuffer(columns, rows) : generateXLSXBuffer(columns, rows);
  const ext = sub.format === "CSV" ? "csv" : "xlsx";

  await sendEmail({
    to: sub.recipients,
    subject: `${report.name} — ${start} to ${end}`,
    html: `<p>Attached: <strong>${report.name}</strong> for the period ${start} to ${end}.</p><p>Sent from your HR dashboard's report scheduler.</p>`,
    attachment: { filename: `${slug(report.name)}.${ext}`, buffer },
  });

  return { start, end, reportName: report.name, emailSent: true };
}
