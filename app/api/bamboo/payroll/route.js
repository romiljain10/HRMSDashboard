import { NextResponse } from "next/server";
import { getPayrollDataset } from "@/services/bamboo/payrollService";
import { handleBambooError } from "@/lib/bamboohr/errors";
import { getSession, resolveAllowedProperty } from "@/lib/session";
import { buildDepartmentTotals, buildBurdenByDepartment, buildCurrentPeriodTotals } from "@/lib/payroll/aggregates";
import { round2 } from "@/lib/payroll/config";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const requestedProperty = searchParams.get("property");

    const session = await getSession();
    const allowedProperty = resolveAllowedProperty(session, requestedProperty);

    const dataset = await getPayrollDataset({ start, end });

    // A property-restricted user only ever gets that one property's data
    // back — enforced here, not just filtered client-side, so calling
    // this endpoint directly can't be used to see other properties.
    if (allowedProperty && allowedProperty !== "All Locations") {
      const employees = dataset.employees.filter((e) => e.location === allowedProperty);
      return NextResponse.json({
        ...dataset,
        employees,
        departmentTotals: buildDepartmentTotals(employees),
        burdenByDepartment: buildBurdenByDepartment(employees),
        currentPeriodTotals: buildCurrentPeriodTotals(employees),
        grandTotal: round2(employees.reduce((s, e) => s + e.totalCost + (e.ptoCost || 0), 0)),
      });
    }

    return NextResponse.json(dataset);
  } catch (err) {
    return handleBambooError(err);
  }
}
