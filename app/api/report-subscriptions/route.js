import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { getReportSubscriptionsCollection } from "@/lib/db/collections";
import { REPORTS_CATALOG } from "@/lib/reports/catalog";

export async function GET() {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  try {
    const collection = await getReportSubscriptionsCollection();
    const subs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ subscriptions: subs });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  const body = await request.json().catch(() => null);
  const { reportKey, recipients, frequency, dayOfWeek, dayOfMonth, format } = body || {};

  if (!reportKey || !REPORTS_CATALOG.some((r) => r.key === reportKey)) {
    return NextResponse.json({ error: "Unknown reportKey." }, { status: 400 });
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "At least one recipient email is required." }, { status: 400 });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const badEmails = recipients.filter((r) => !emailRe.test(r));
  if (badEmails.length > 0) {
    return NextResponse.json({ error: `Invalid email address(es): ${badEmails.join(", ")}` }, { status: 400 });
  }
  if (!["weekly", "monthly"].includes(frequency)) {
    return NextResponse.json({ error: 'frequency must be "weekly" or "monthly".' }, { status: 400 });
  }
  if (frequency === "weekly" && (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6)) {
    return NextResponse.json({ error: "dayOfWeek (0-6) is required for weekly schedules." }, { status: 400 });
  }
  if (frequency === "monthly" && (dayOfMonth == null || dayOfMonth < 1 || dayOfMonth > 28)) {
    return NextResponse.json({ error: "dayOfMonth (1-28, to stay valid every month) is required for monthly schedules." }, { status: 400 });
  }
  if (!["CSV", "XLSX"].includes(format)) {
    return NextResponse.json({ error: 'format must be "CSV" or "XLSX" — scheduled emails don\'t support PDF (no headless browser available server-side).' }, { status: 400 });
  }

  try {
    const collection = await getReportSubscriptionsCollection();
    const doc = {
      reportKey,
      recipients,
      frequency,
      dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : null,
      dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : null,
      format,
      active: true,
      createdBy: session.username,
      createdAt: new Date(),
      lastSentAt: null,
    };
    const result = await collection.insertOne(doc);
    return NextResponse.json({ ok: true, id: result.insertedId });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
