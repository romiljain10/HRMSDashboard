import { getPayrollDataset, getPayrollTrend } from "@/services/bamboo/payrollService";
import { buildReportRows } from "@/lib/reports/buildRows";
import { generateCSVBuffer, generateXLSXBuffer, slug } from "@/lib/reports/generateFile";
import { sendEmail } from "@/lib/email/resend";
import { REPORTS_CATALOG } from "@/lib/reports/catalog";

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

  return { start, end, reportName: report.name };
}
