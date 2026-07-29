import { NextResponse } from "next/server";
import { getPayrollDataset } from "@/services/bamboo/payrollService";
import { handleBambooError } from "@/lib/bamboohr/errors";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const dataset = await getPayrollDataset({ start, end });
    return NextResponse.json(dataset);
  } catch (err) {
    return handleBambooError(err);
  }
}
