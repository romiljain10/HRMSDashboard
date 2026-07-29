import { bambooGet, bambooPost, BambooHRError } from "@/lib/bamboohr/client";
import { cached } from "@/lib/bamboohr/cache";
import { fetchAllPtoBalances } from "@/services/bamboo/timeOffService";
import {
  burdenRateFor,
  departmentGroupFor,
  computeLaborCost,
  round2,
} from "@/lib/payroll/config";
import {
  buildDepartmentTotals,
  buildBurdenByDepartment,
  buildCurrentPeriodTotals,
  buildDepartmentGroups,
} from "@/lib/payroll/aggregates";

const REPORT_FIELDS = [
  "employeeNumber",
  "firstName",
  "lastName",
  "displayName",
  "jobTitle",
  "department",
  "location",
  "supervisor",
  "status",
  "hireDate",
  "payRate",
  "payRateCurrency",
  "payType",
];

const STANDARD_ANNUAL_HOURS = 2080; // 40 hrs/week * 52 weeks — used to convert salaried pay to an hourly equivalent

// Fallback pay period, used only if no start/end is supplied by the caller —
// callers should normally pass the user's selected date range (see
// getPayrollDataset below), which is synced with BambooHR queries.
export function getCurrentPayPeriod() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
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
    location: row.location || "Unassigned",
    manager: row.supervisor || null,
    status: row.status === "Active" ? "Active" : row.status || "Inactive",
    hireDate: row.hireDate || null,
    payType: row.payType || "Hourly",
    // payRate comes back as e.g. "18.00" (hourly) or "85,000.00" (annual,
    // when payType is Salary/Yearly) — normalize both to an hourly rate so
    // downstream labor-cost math is consistent regardless of pay type.
    baseRate: parsePayRate(row.payRate, row.payType),
  }));
}

function parsePayRate(value, payType) {
  if (value == null) return 0;
  // Strip thousands separators before matching, or "175,000.00" would be
  // truncated to "175" at the first comma.
  const cleaned = String(value).replace(/,/g, "");
  const match = cleaned.match(/[\d.]+/);
  const amount = match ? parseFloat(match[0]) : 0;

  const isSalaried = /salary|year|annual/i.test(payType || "");
  return isSalaried ? round2(amount / STANDARD_ANNUAL_HOURS) : amount;
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
export async function getPayrollDataset({ start: startISO, end: endISO } = {}) {
  const { start, end } = startISO && endISO
    ? { start: new Date(startISO + "T00:00:00"), end: new Date(endISO + "T23:59:59") }
    : getCurrentPayPeriod();
  const cacheKey = `payroll-dataset:${start.toISOString().slice(0, 10)}:${end.toISOString().slice(0, 10)}`;

  return cached(cacheKey, async () => {
    const directory = await fetchDirectoryWithCompensation();
    const active = directory; // include all; UI filters by status itself
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

