import { NextResponse } from "next/server";
import { getPayrollDataset } from "@/services/bamboo/payrollService";
import { handleBambooError } from "@/lib/bamboohr/errors";

export async function GET() {
  try {
    const dataset = await getPayrollDataset();
    return NextResponse.json(dataset);
  } catch (err) {
    return handleBambooError(err);
  }
}
