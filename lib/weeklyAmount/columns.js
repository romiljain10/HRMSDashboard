// Shared column shape for per-employee weekly amounts — used by Gratuity
// and Bonus. Property must match a BambooHR location name exactly;
// Employee Name is matched against that property's real employee
// directory on upload (see matchEmployee.js) — unmatched names are
// flagged rather than silently dropped.
export function weeklyAmountColumns(amountLabel) {
  return [
    { key: "property", label: "Property Name", type: "string", required: true,
      help: "Must match a location name exactly as it appears in the app's Location filter (e.g. \"Lake Buena Vista\")." },
    { key: "employeeName", label: "Employee Name", type: "string", required: true,
      help: "Must match an employee's name at that property exactly (case-insensitive)." },
    { key: "amount", label: amountLabel, type: "number", required: true },
    { key: "burdenPct", label: "Payroll Cost, Tax, Benefits and Workers Comp", type: "percent", required: true,
      help: "Enter as a plain percentage, e.g. 27.50 for 27.50% — not 0.275." },
    { key: "weekStart", label: "From", type: "date", required: true },
    { key: "weekEnd", label: "To", type: "date", required: true },
  ];
}

export function weeklyAmountExampleRows(amountExamples) {
  return amountExamples.map((e) => ({
    property: "Red Lion",
    employeeName: e.employeeName,
    amount: e.amount,
    burdenPct: 27.5,
    weekStart: "2026-09-07",
    weekEnd: "2026-09-13",
  }));
}
