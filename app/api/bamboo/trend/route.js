import { NextResponse } from "next/server";
import { getPayrollTrend } from "@/services/bamboo/payrollService";
import { handleBambooError } from "@/lib/bamboohr/errors";
import { getSession, resolveAllowedProperty } from "@/lib/session";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const end = searchParams.get("end");
    const weeks = Number(searchParams.get("weeks")) || 6;
    const requestedProperty = searchParams.get("property");

    const session = await getSession();
    const allowedProperty = resolveAllowedProperty(session, requestedProperty);

    const trend = await getPayrollTrend({ end, weeks });

    if (allowedProperty && allowedProperty !== "All Locations") {
      const weeksFiltered = trend.weeks.map((w) => ({
        ...w,
        employeeCosts: w.employeeCosts.filter((e) => e.location === allowedProperty),
      }));
      return NextResponse.json({ ...trend, weeks: weeksFiltered });
    }

    return NextResponse.json(trend);
  } catch (err) {
    return handleBambooError(err);
  }
}
