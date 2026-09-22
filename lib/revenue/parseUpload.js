import * as XLSX from "xlsx";
import { REVENUE_COLUMNS } from "@/lib/revenue/columns";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateStr(v) {
  if (typeof v === "string" && DATE_RE.test(v)) {
    return !isNaN(new Date(v + "T00:00:00").getTime());
  }
  // Excel may hand back a Date object if the cell was formatted as a date.
  if (v instanceof Date && !isNaN(v.getTime())) return true;
  return false;
}

function toDateStr(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function validateCell(col, rawValue, rowNum, errors) {
  const isEmpty = rawValue === undefined || rawValue === null || String(rawValue).trim() === "";

  if (isEmpty) {
    if (col.required) {
      errors.push(`Row ${rowNum}: "${col.label}" is required but empty.`);
    }
    return null;
  }

  switch (col.type) {
    case "string":
      return String(rawValue).trim();

    case "date": {
      if (!isValidDateStr(rawValue)) {
        errors.push(`Row ${rowNum}: "${col.label}" must be a valid date (YYYY-MM-DD), got "${rawValue}".`);
        return null;
      }
      return toDateStr(rawValue);
    }

    case "number": {
      const n = Number(rawValue);
      if (Number.isNaN(n)) {
        errors.push(`Row ${rowNum}: "${col.label}" must be a number, got "${rawValue}".`);
        return null;
      }
      return n;
    }

    case "percent": {
      const n = Number(rawValue);
      if (Number.isNaN(n)) {
        errors.push(`Row ${rowNum}: "${col.label}" must be a number, got "${rawValue}".`);
        return null;
      }
      if (n < 0 || n > 100) {
        errors.push(`Row ${rowNum}: "${col.label}" should be between 0 and 100 (a plain percentage, not a decimal fraction) — got ${n}.`);
        return null;
      }
      return n;
    }

    default:
      return rawValue;
  }
}

/**
 * Parses an uploaded revenue workbook (Buffer/ArrayBuffer) into validated
 * rows. Returns { rows, errors } — if errors is non-empty, the caller
 * should reject the whole upload rather than writing partial data, so a
 * mistake never leaves the dashboard half-correct.
 */
export function parseRevenueUpload(fileBuffer) {
  const errors = [];
  let workbook;

  try {
    workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
  } catch {
    return { rows: [], errors: ["Could not read this file — make sure it's a valid .xlsx file."] };
  }

  const sheetName = workbook.SheetNames.includes("Revenue Data") ? "Revenue Data" : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { rows: [], errors: ["No sheet found in this workbook."] };
  }

  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (raw.length === 0) {
    return { rows: [], errors: ["No data rows found — the sheet is empty below the header row."] };
  }

  // Map header text -> column def, tolerant of the exact label text from
  // the template (so re-uploading a downloaded-then-filled template works).
  const headerToCol = new Map(REVENUE_COLUMNS.map((c) => [c.label, c]));

  const rows = [];
  raw.forEach((rawRow, i) => {
    const rowNum = i + 2; // +1 for header, +1 for 1-based row numbering
    const row = {};
    let rowHasAnyValue = false;

    for (const col of REVENUE_COLUMNS) {
      const rawValue = rawRow[col.label];
      if (rawValue !== undefined && String(rawValue).trim() !== "") rowHasAnyValue = true;
      row[col.key] = validateCell(col, rawValue, rowNum, errors);
    }

    if (!rowHasAnyValue) return; // skip fully blank rows silently

    if (row.periodStart && row.periodEnd && row.periodStart > row.periodEnd) {
      errors.push(`Row ${rowNum}: Period Start (${row.periodStart}) is after Period End (${row.periodEnd}).`);
    }

    rows.push(row);
  });

  return { rows, errors };
}
