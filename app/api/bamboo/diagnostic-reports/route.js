import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";
import { bambooGet } from "@/lib/bamboohr/client";
import { handleBambooError } from "@/lib/bamboohr/errors";

// One-off diagnostic route (Admin-only) to inspect BambooHR's saved
// reports and the Timesheets API — used to find real field names (e.g.
// for Holiday/PTO hour breakdowns) instead of guessing.
//
// Usage:
//   ?type=reports              -> list saved custom reports
//   ?type=reports&id=X         -> execute saved report X
//   ?type=timesheets&start=&end=  -> list timesheets in a date range (new Timesheets API)
//   ?type=timesheet&id=X       -> full detail for one timesheet (its real field names)
export async function GET(request) {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "reports";
  const id = searchParams.get("id");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  try {
    if (type === "reports") {
      if (id) {
        const report = await bambooGet(`/custom-reports/${id}`, { format: "json" });
        return NextResponse.json({ report });
      }
      const list = await bambooGet("/custom-reports");
      return NextResponse.json({ reports: list });
    }

    if (type === "timesheets") {
      const filterParts = [];
      if (start) filterParts.push(`startDate ge '${start}'`);
      if (end) filterParts.push(`endDate le '${end}'`);
      const list = await bambooGet("/time-tracking/timesheets", {
        filter: filterParts.join(" and ") || undefined,
        pageSize: 50,
      });
      return NextResponse.json({ timesheets: list });
    }

    if (type === "timesheet" && id) {
      const timesheet = await bambooGet(`/time-tracking/timesheets/${id}`);
      return NextResponse.json({ timesheet });
    }

    if (type === "timesheet-summary" && id) {
      const summary = await bambooGet(`/time-tracking/timesheets/${id}/summary`);
      return NextResponse.json({ summary });
    }

    return NextResponse.json({ error: "Unknown type. Use reports, timesheets, timesheet, or timesheet-summary." }, { status: 400 });
  } catch (err) {
    return handleBambooError(err);
  }
}
