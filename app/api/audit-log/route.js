import { NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import {
  getRevenueSnapshotsCollection,
  getTipsCollection,
  getUsersCollection,
  getReportSubscriptionsCollection,
} from "@/lib/db/collections";

export async function GET(request) {
  const session = await requireRole(["Admin"]);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 300);

  try {
    const [revenueCol, tipsCol, usersCol, subsCol] = await Promise.all([
      getRevenueSnapshotsCollection(),
      getTipsCollection(),
      getUsersCollection(),
      getReportSubscriptionsCollection(),
    ]);

    const [revenueUploads, tipsEntries, users, subscriptions] = await Promise.all([
      revenueCol.find({}).sort({ uploadedAt: -1 }).limit(limit).toArray(),
      tipsCol.find({}).sort({ enteredAt: -1 }).limit(limit).toArray(),
      usersCol.find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
      subsCol.find({}).sort({ createdAt: -1 }).limit(limit).toArray(),
    ]);

    const events = [
      ...revenueUploads.map((r) => ({
        type: "revenue_upload",
        summary: `Revenue uploaded for ${r.property} (${r.periodStart} to ${r.periodEnd})`,
        actor: r.uploadedBy,
        at: r.uploadedAt,
        detail: r.sourceFileName,
      })),
      ...tipsEntries.map((t) => ({
        type: "tips_entry",
        summary: `Tips entered for ${t.property} (${t.weekStart} to ${t.weekEnd}): $${(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        actor: t.enteredBy,
        at: t.enteredAt,
      })),
      ...users.map((u) => ({
        type: "user_created",
        summary: `User "${u.username}" created (${u.role})${u.createdBy ? "" : " — imported from USERS_JSON"}`,
        actor: u.createdBy || "system",
        at: u.createdAt,
      })),
      ...subscriptions.map((s) => ({
        type: "schedule_created",
        summary: `Scheduled "${s.reportKey}" — ${s.frequency}, ${s.recipients?.length || 0} recipient(s)`,
        actor: s.createdBy,
        at: s.createdAt,
      })),
    ]
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, limit);

    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
  }
}
