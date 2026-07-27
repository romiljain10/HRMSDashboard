import { bambooGet, bambooPost, BambooHRError } from "@/lib/bamboohr/client";
import { cached } from "@/lib/bamboohr/cache";
import { fetchAllPtoBalances } from "@/services/bamboo/timeOffService";
import {
  burdenRateFor,
  departmentGroupFor,
  computeLaborCost,
  round2,
} from "@/lib/payroll/config";

const REPORT_FIELDS = [
  "employeeNumber",
  "firstName",
  "lastName",
  "displayName",
  "jobTitle",
  "department",
  "status",
  "hireDate",
  "payRate",
];

// Current pay period. In production this should come from the pay schedule
// (BambooHR "Time Off" / your payroll calendar) rather than being fixed —
// left as a single source of truth here so every consumer stays in sync.
export function getCurrentPayPeriod() {
  const start = new Date("2026-04-27T00:00:00");
  const end = new Date("2026-05-03T23:59:59");
  return { start, end };
}

/**
 * Pulls employee identity + pay rate from BambooHR via a custom report
 * (one request for the whole company, instead of N+1 per-employee calls).
 */
async function fetchDirectoryWithCompensation() {
  const data = await bambooPost(
    "/reports/custom",
    { title: "Payroll Sync", fields: REPORT_FIELDS },
    { format: "JSON" }
  );

  const rows = data?.employees ?? [];
  return rows.map((row) => ({
    id: row.id,
    employeeNumber: row.employeeNumber || row.id,
    name: row.displayName || `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
    title: row.jobTitle || "",
    department: row.department || "Unassigned",
    departmentGroup: departmentGroupFor(row.department),
    status: row.status === "Active" ? "Active" : row.status || "Inactive",
    hireDate: row.hireDate || null,
    // payRate typically comes back as "18.00" with a separate payRateCurrency,
    // or as "18.00 USD" depending on account config — handle both.
    baseRate: parsePayRate(row.payRate),
  }));
}

function parsePayRate(value) {
  if (value == null) return 0;
  const match = String(value).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Best-effort live hours from BambooHR Time Tracking for the current pay
 * period. Time Tracking is an optional add-on — if it isn't enabled on the
 * account, or the request fails, we fall back to zero hours for that
 * employee and mark the dataset as degraded so the UI can say so.
 */
async function fetchWeeklyHours(employeeIds, start, end) {
  const isoStart = start.toISOString().slice(0, 10);
  const isoEnd = end.toISOString().slice(0, 10);

  try {
    const data = await bambooGet("/time_tracking/timesheet_entries", {
      employeeIds: employeeIds.join(","),
      start: isoStart,
      end: isoEnd,
    });

    const entries = Array.isArray(data) ? data : data?.timesheetEntries ?? [];
    const hoursByEmployee = new Map();

    for (const entry of entries) {
      const empId = String(entry.employeeId);
      const bucket = hoursByEmployee.get(empId) || { regularHours: 0, otHours: 0, holidayHours: 0 };
      const hrs = Number(entry.hours) || 0;
      if (entry.type === "overtime") bucket.otHours += hrs;
      else if (entry.type === "holiday") bucket.holidayHours += hrs;
      else bucket.regularHours += hrs;
      hoursByEmployee.set(empId, bucket);
    }

    return { hoursByEmployee, live: true };
  } catch (err) {
    // Time Tracking not enabled / not permitted / transient failure — degrade
    // gracefully rather than failing the whole payroll view.
    return { hoursByEmployee: new Map(), live: false, error: err instanceof BambooHRError ? err.code : "UNKNOWN" };
  }
}

/**
 * Full live payroll dataset for the current pay period: employees (with
 * computed labor cost), department rollups, and grand total — same shape
 * the UI previously read from the static data/employees.js file.
 */
export async function getPayrollDataset() {
  return cached("payroll-dataset", async () => {
    const directory = await fetchDirectoryWithCompensation();
    const active = directory; // include all; UI filters by status itself
    const { start, end } = getCurrentPayPeriod();
    const { hoursByEmployee, live: hoursLive } = await fetchWeeklyHours(
      active.map((e) => e.id),
      start,
      end
    );
    const { balances: ptoBalances, live: ptoLive } = await fetchAllPtoBalances(
      active.map((e) => e.id),
      end.toISOString().slice(0, 10)
    );

    const employees = active.map((e) => {
      const hours = hoursByEmployee.get(String(e.id)) || {
        regularHours: 0,
        otHours: 0,
        holidayHours: 0,
      };
      const pto = ptoBalances.get(String(e.id)) || {
        ptoAccrued: 0,
        ptoUsed: 0,
        ptoBalance: 0,
      };
      const burden = burdenRateFor(e.departmentGroup);
      const cost = computeLaborCost({
        baseRate: e.baseRate,
        burden,
        ...hours,
      });

      return {
        ...e,
        ...hours,
        ...pto,
        burden,
        ...cost,
        // BambooHR has no payroll-approval workflow of its own — this stays
        // a locally managed status. Default to Pending until this app's own
        // approval flow is implemented.
        approvalStatus: "Pending",
      };
    });

    return {
      employees,
      departmentTotals: buildDepartmentTotals(employees),
      burdenByDepartment: buildBurdenByDepartment(employees),
      departmentGroups: buildDepartmentGroups(employees),
      grandTotal: round2(employees.reduce((sum, e) => sum + e.totalCost, 0)),
      currentPeriodTotals: buildCurrentPeriodTotals(employees),
      meta: { hoursLive, ptoLive },
    };
  });
}

function buildDepartmentTotals(employees) {
  const byDept = employees.reduce((acc, e) => {
    if (!acc[e.department]) {
      acc[e.department] = {
        department: e.department,
        group: e.departmentGroup,
        total: 0,
        hours: 0,
        otHours: 0,
        holidayHours: 0,
      };
    }
    const d = acc[e.department];
    d.total += e.totalCost;
    d.hours += e.regularHours;
    d.otHours += e.otHours;
    d.holidayHours += e.holidayHours;
    return acc;
  }, {});

  return Object.values(byDept).map((d) => ({
    ...d,
    total: round2(d.total),
    hours: round2(d.hours),
    otHours: round2(d.otHours),
    holidayHours: round2(d.holidayHours),
  }));
}

function buildBurdenByDepartment(employees) {
  const byDept = employees.reduce((acc, e) => {
    if (!acc[e.department]) {
      acc[e.department] = {
        department: e.department,
        group: e.departmentGroup,
        regularBurden: 0,
        otBurden: 0,
        holidayBurden: 0,
      };
    }
    const d = acc[e.department];
    d.regularBurden += e.regularHours * e.baseRate * e.burden;
    d.otBurden += e.otHours * e.baseRate * 1.5 * e.burden;
    d.holidayBurden += e.holidayHours * e.baseRate * 1.5 * e.burden;
    return acc;
  }, {});

  return Object.values(byDept).map((d) => ({
    ...d,
    regularBurden: round2(d.regularBurden),
    otBurden: round2(d.otBurden),
    holidayBurden: round2(d.holidayBurden),
    totalBurden: round2(d.regularBurden + d.otBurden + d.holidayBurden),
  }));
}

function buildCurrentPeriodTotals(employees) {
  const totals = {
    regularHours: round2(employees.reduce((s, e) => s + e.regularHours, 0)),
    otHours: round2(employees.reduce((s, e) => s + e.otHours, 0)),
    holidayHours: round2(employees.reduce((s, e) => s + e.holidayHours, 0)),
    totalCost: round2(employees.reduce((s, e) => s + e.totalCost, 0)),
  };
  totals.totalHours = round2(totals.regularHours + totals.otHours + totals.holidayHours);
  return totals;
}

function buildDepartmentGroups(employees) {
  const groups = {};
  for (const e of employees) {
    if (!groups[e.departmentGroup]) groups[e.departmentGroup] = [];
    groups[e.departmentGroup].push(e);
  }
  return groups;
}
