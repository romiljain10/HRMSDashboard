import { NextResponse } from "next/server";
import { getPayrollTrend } from "@/services/bamboo/payrollService";
import { handleBambooError } from "@/lib/bamboohr/errors";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const end = searchParams.get("end");
    const weeks = Number(searchParams.get("weeks")) || 6;
    const trend = await getPayrollTrend({ end, weeks });
    return NextResponse.json(trend);
  } catch (err) {
    return handleBambooError(err);
  }
}
