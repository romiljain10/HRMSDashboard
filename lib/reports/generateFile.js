import * as XLSX from "xlsx";

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function generateCSVBuffer(columns, rows) {
  const lines = [columns.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return Buffer.from(lines.join("\n"), "utf-8");
}

export function generateXLSXBuffer(columns, rows) {
  const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

export function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
