import * as XLSX from "xlsx";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateStr(v) {
  if (typeof v === "string" && DATE_RE.test(v)) {
    return !isNaN(new Date(v + "T00:00:00").getTime());
  }
  if (v instanceof Date && !isNaN(v.getTime())) return true;
  return false;
}

function toDateStr(v) {
  if (v instanceof Date) {
    // Excel dates arrive as local-midnight Dates; nudge by 12h and read the
    // local calendar day so the result is the same on any server timezone.
    const d = new Date(v.getTime() + 12 * 3600 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return String(v).trim();
}

function validateCell(col, rawValue, rowNum, errors) {
  const isEmpty = rawValue === undefined || rawValue === null || String(rawValue).trim() === "";

  if (isEmpty) {
    if (col.required) errors.push(`Row ${rowNum}: "${col.label}" is required but empty.`);
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
      if (n < 0) {
        errors.push(`Row ${rowNum}: "${col.label}" can't be negative — got ${n}.`);
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
 * Parses an uploaded weekly-amount workbook (property + week + amount)
 * into validated rows. Returns { rows, errors } — if errors is non-empty,
 * the caller should reject the whole upload rather than writing partial
 * data, so a mistake never leaves the dashboard half-correct.
 */
export function parseWeeklyAmountUpload(fileBuffer, columns, sheetNameHint) {
  const errors = [];
  let workbook;

  try {
    workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
  } catch {
    return { rows: [], errors: ["Could not read this file — make sure it's a valid .xlsx file."] };
  }

  const sheetName = workbook.SheetNames.includes(sheetNameHint) ? sheetNameHint : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { rows: [], errors: ["No sheet found in this workbook."] };

  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (raw.length === 0) {
    return { rows: [], errors: ["No data rows found — the sheet is empty below the header row."] };
  }

  // Header matching is forgiving: case, spacing and "($)" are ignored, and the
  // amount column also accepts Tip/Tips/Gratuity/Bonus/Amount variants so an
  // older or hand-edited template still uploads.
  const norm = (s) => String(s || "").toLowerCase().replace(/\(\$\)/g, "").replace(/[^a-z0-9]/g, "");
  const AMOUNT_ALIASES = ["amount", "tipamount", "tips", "tip", "gratuity", "gratuityamount", "bonus", "bonusamount"];
  const headerByNorm = new Map();
  for (const h of Object.keys(raw[0])) if (!headerByNorm.has(norm(h))) headerByNorm.set(norm(h), h);
  const headerFor = (col) => {
    const wanted = [norm(col.label), ...(col.key === "amount" ? AMOUNT_ALIASES : [])];
    for (const w of wanted) if (headerByNorm.has(w)) return headerByNorm.get(w);
    return col.label;
  };
  const headerMap = Object.fromEntries(columns.map((c) => [c.key, headerFor(c)]));

  const rows = [];
  raw.forEach((rawRow, i) => {
    const rowNum = i + 2;
    const row = {};
    let rowHasAnyValue = false;

    for (const col of columns) {
      const rawValue = rawRow[headerMap[col.key]];
      if (rawValue !== undefined && String(rawValue).trim() !== "") rowHasAnyValue = true;
      row[col.key] = validateCell(col, rawValue, rowNum, errors);
    }

    if (!rowHasAnyValue) return;

    if (row.weekStart && row.weekEnd && row.weekStart > row.weekEnd) {
      errors.push(`Row ${rowNum}: Week Start (${row.weekStart}) is after Week End (${row.weekEnd}).`);
    }

    rows.push(row);
  });

  return { rows, errors };
}
