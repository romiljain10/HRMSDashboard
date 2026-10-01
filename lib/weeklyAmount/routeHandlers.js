import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/session";
import { weeklyAmountColumns, weeklyAmountExampleRows } from "@/lib/weeklyAmount/columns";
import { parseWeeklyAmountUpload } from "@/lib/weeklyAmount/parseUpload";
import { matchEmployeeByName } from "@/lib/weeklyAmount/matchEmployee";
import { fetchDirectoryWithCompensation } from "@/services/bamboo/payrollService";

/**
 * GET handler: generates and returns the downloadable template. Includes
 * a "Total" column with a live Excel formula (Amount × (1 + Burden%)) so
 * it's visible for reference while filling the sheet in — it's not part
 * of the uploaded data itself; the server recomputes Total from Amount
 * and Burden% on upload rather than trusting a typed-in value.
 */
export function makeTemplateHandler({ amountLabel, sheetName, exampleRows, fileLabel }) {
  const columns = weeklyAmountColumns(amountLabel);

  return async function GET() {
    const session = await requireRole(["Admin", "Payroll Manager"]);
    if (session instanceof NextResponse) return session;

    const headers = [...columns.map((c) => c.label), "Total (reference only — recalculated on upload)"];
    const examples = weeklyAmountExampleRows(exampleRows);

    const aoa = [headers];
    examples.forEach((ex) => aoa.push(columns.map((c) => ex[c.key] ?? "")));

    const dataSheet = XLSX.utils.aoa_to_sheet(aoa);
    const amountColIdx = columns.findIndex((c) => c.key === "amount");
    const burdenColIdx = columns.findIndex((c) => c.key === "burdenPct");
    const totalColIdx = columns.length;
    examples.forEach((ex, i) => {
      const r = i + 1;
      const amountCell = XLSX.utils.encode_cell({ r, c: amountColIdx });
      const burdenCell = XLSX.utils.encode_cell({ r, c: burdenColIdx });
      const totalCell = XLSX.utils.encode_cell({ r, c: totalColIdx });
      // A formula cell needs a cached `v` alongside `f`, or most writers
      // (including this one) silently drop it on write.
      const cachedValue = Math.round(ex.amount * (1 + 27.5 / 100) * 100) / 100;
      dataSheet[totalCell] = { t: "n", f: `${amountCell}*(1+${burdenCell}/100)`, v: cachedValue };
    });
    // aoa_to_sheet sizes !ref from the array data only — cells added
    // afterward in a column beyond that (the Total column here) need the
    // range expanded manually, or they get silently dropped on write.
    const range = XLSX.utils.decode_range(dataSheet["!ref"]);
    range.e.c = Math.max(range.e.c, totalColIdx);
    dataSheet["!ref"] = XLSX.utils.encode_range(range);
    dataSheet["!cols"] = [...columns.map(() => ({ wch: 24 })), { wch: 20 }];

    const instructions = [
      ["How to use this template"],
      [""],
      ["1. Delete the example rows once you're ready to enter real data."],
      ["2. Add one row per employee per week."],
      ["3. Property Name must match a location name exactly as it appears in the app's Location filter."],
      ["4. Employee Name must match that employee's name at that property exactly (case-insensitive) — if it doesn't match, the row is flagged as an error rather than silently dropped."],
      ["5. Payroll Cost, Tax, Benefits and Workers Comp is a plain percentage (27.50 for 27.50%), not a decimal."],
      ["6. From / To dates must be in YYYY-MM-DD format."],
      ["7. The Total column is for your reference only (auto-calculated by formula) — the server recalculates it from Amount and the percentage on upload, so you don't need to type it."],
      [`8. Save and upload this file on the ${fileLabel} page.`],
    ];
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet["!cols"] = [{ wch: 70 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, dataSheet, sheetName);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileLabel.toLowerCase().replace(/\s+/g, "-")}-template.xlsx"`,
      },
    });
  };
}

/**
 * POST handler: parses + validates + matches each row's Employee Name
 * against the live BambooHR directory for that property + computes Total
 * server-side (Amount × (1 + Burden%/100)) + upserts one document per
 * (property, employeeName, weekStart) so re-uploading the same person's
 * same week corrects it rather than duplicating.
 */
export function makeUploadHandler({ getCollection, amountLabel, sheetName }) {
  const columns = weeklyAmountColumns(amountLabel);

  return async function POST(request) {
    const session = await requireRole(["Admin", "Payroll Manager"]);
    if (session instanceof NextResponse) return session;

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { rows, errors } = parseWeeklyAmountUpload(buffer, columns, sheetName);

    if (errors.length > 0) {
      return NextResponse.json({ error: "This file has validation errors — nothing was saved.", details: errors }, { status: 400 });
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in this file." }, { status: 400 });
    }

    let directory;
    try {
      ({ employees: directory } = await fetchDirectoryWithCompensation());
    } catch (err) {
      return NextResponse.json({ error: `Couldn't reach BambooHR to match employee names: ${err.message}` }, { status: 502 });
    }

    const warnings = [];
    const documents = rows.map((row) => {
      const match = matchEmployeeByName(row.property, row.employeeName, directory);
      if (!match.matched) warnings.push(match.reason);
      const total = Math.round(row.amount * (1 + row.burdenPct / 100) * 100) / 100;
      return { ...row, employeeId: match.employeeId, total };
    });

    try {
      const collection = await getCollection();
      const now = new Date();
      for (const doc of documents) {
        await collection.updateOne(
          { property: doc.property, employeeName: doc.employeeName, weekStart: doc.weekStart },
          { $set: { ...doc, enteredBy: session.username, enteredAt: now, sourceFileName: file.name || "upload.xlsx" } },
          { upsert: true }
        );
      }
      return NextResponse.json({
        ok: true,
        inserted: documents.length,
        properties: [...new Set(rows.map((r) => r.property))],
        warnings,
      });
    } catch (err) {
      return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
    }
  };
}

/** GET (list recent) + POST (single manual entry, upsert) handlers. */
export function makeListCreateHandlers({ getCollection }) {
  async function GET(request) {
    const session = await requireRole(["Admin", "Payroll Manager", "Viewer"]);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const property = searchParams.get("property");
    const weekStart = searchParams.get("weekStart");

    try {
      const collection = await getCollection();
      const query = {};
      if (property && property !== "All Locations") query.property = property;
      if (weekStart) query.weekStart = weekStart;
      const items = await collection.find(query).sort({ weekStart: -1 }).limit(50).toArray();
      return NextResponse.json({ items });
    } catch (err) {
      return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
    }
  }

  async function POST(request) {
    const session = await requireRole(["Admin", "Payroll Manager"]);
    if (session instanceof NextResponse) return session;

    const body = await request.json().catch(() => null);
    const { property, employeeName, weekStart, weekEnd, amount, burdenPct } = body || {};
    if (!property || !employeeName || !weekStart || !weekEnd) {
      return NextResponse.json({ error: "Property, employeeName, weekStart, and weekEnd are required." }, { status: 400 });
    }
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: "Amount must be a non-negative number." }, { status: 400 });
    }
    const parsedBurden = Number(burdenPct);
    if (Number.isNaN(parsedBurden) || parsedBurden < 0 || parsedBurden > 100) {
      return NextResponse.json({ error: "burdenPct must be a number between 0 and 100." }, { status: 400 });
    }

    try {
      const { employees: directory } = await fetchDirectoryWithCompensation();
      const match = matchEmployeeByName(property, employeeName, directory);
      const total = Math.round(parsedAmount * (1 + parsedBurden / 100) * 100) / 100;

      const collection = await getCollection();
      await collection.updateOne(
        { property, employeeName, weekStart },
        {
          $set: {
            property, employeeName, weekStart, weekEnd,
            amount: parsedAmount, burdenPct: parsedBurden, total,
            employeeId: match.employeeId,
            enteredBy: session.username, enteredAt: new Date(), sourceFileName: null,
          },
        },
        { upsert: true }
      );
      return NextResponse.json({ ok: true, matched: match.matched, warning: match.matched ? null : match.reason });
    } catch (err) {
      return NextResponse.json({ error: `Database error: ${err.message}` }, { status: 500 });
    }
  }

  return { GET, POST };
}
