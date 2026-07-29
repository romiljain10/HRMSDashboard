import { NextResponse } from "next/server";
import { getEmployeeDirectory, getEmployeeKpis } from "@/services/bamboo/employeeService";
import { handleBambooError } from "@/lib/bamboohr/errors";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const withKpis = searchParams.get("kpis") === "true";

    const [employees, kpis] = await Promise.all([
      getEmployeeDirectory(),
      withKpis ? getEmployeeKpis() : Promise.resolve(null),
    ]);

    return NextResponse.json({ employees, kpis });
  } catch (err) {
    return handleBambooError(err);
  }
}
