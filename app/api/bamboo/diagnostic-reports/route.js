import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth";
import { bambooGet } from "@/lib/bamboohr/client";
import { handleBambooError } from "@/lib/bamboohr/errors";

// One-off diagnostic route (Admin-only) to inspect BambooHR's saved
// reports — used to find the ID of an existing report (e.g. "Payroll
// Hours") and, when ?id= is passed, fetch that report's actual data so we
// can see its real field/column names instead of guessing.
export async function GET(request) {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session || session.role !== "Admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      const report = await bambooGet(`/custom-reports/${id}`, { format: "json" });
      return NextResponse.json({ report });
    }
    const list = await bambooGet("/custom-reports");
    return NextResponse.json({ reports: list });
  } catch (err) {
    return handleBambooError(err);
  }
}
