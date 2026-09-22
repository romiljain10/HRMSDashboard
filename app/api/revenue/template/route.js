import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/session";
import { REVENUE_COLUMNS, EXAMPLE_ROW } from "@/lib/revenue/columns";

export async function GET() {
  const session = await requireRole(["Admin", "Payroll Manager"]);
  if (session instanceof NextResponse) return session;

  const headers = REVENUE_COLUMNS.map((c) => c.label);
  const exampleRow = REVENUE_COLUMNS.map((c) => EXAMPLE_ROW[c.key] ?? "");

  const dataSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  dataSheet["!cols"] = REVENUE_COLUMNS.map(() => ({ wch: 26 }));

  const instructionsRows = [
    ["How to use this template"],
    [""],
    ["1. Delete the example row (row 2) once you're ready to enter real data."],
    ["2. Add one row per property per period."],
    ["3. Property must match a location name exactly as it appears in the app's Location filter."],
    ["4. Dates must be in YYYY-MM-DD format."],
    ["5. Occupancy % is a plain number (73.25 for 73.25%), not a decimal fraction."],
    ["6. Save and upload this file on the Revenue page."],
    [""],
    ["Column reference:"],
    ...REVENUE_COLUMNS.map((c) => [c.label, c.required ? "Required" : "Optional", c.help || ""]),
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsRows);
  instructionsSheet["!cols"] = [{ wch: 30 }, { wch: 12 }, { wch: 60 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Revenue Data");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="revenue-upload-template.xlsx"',
    },
  });
}
