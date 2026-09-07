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
  "workEmail",
  "mobilePhone",
  "workPhone",
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

  // BambooHR silently omits fields the API key's user lacks permission for,
  // rather than returning them as null — so if payRate is missing on every
  // single row, that's almost always a permissions gap (the key's user
  // needs "Compensation" view access), not actually $0 pay for everyone.
  const compensationAccessible = rows.length === 0 || rows.some((r) => r.payRate != null);

  const employees = rows.map((row) => ({
    id: row.id,
    employeeNumber: row.employeeNumber || row.id,
    name: row.displayName || `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim(),
    title: row.jobTitle || "",
    email: row.workEmail || "",
    phone: row.mobilePhone || row.workPhone || "",
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

  return { employees, compensationAccessible };
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
/**
 * Normalizes the timesheet_entries response into a flat array of entries,
 * regardless of whether BambooHR returns a flat array, an object keyed by
 * employee ID, or a { employees: [...] } wrapper — the docs say results
 * are "grouped by employee" but don't pin down the exact shape, so this
 * handles the plausible variants defensively.
 */
function normalizeTimesheetEntries(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  if (Array.isArray(data.timesheetEntries)) return data.timesheetEntries;

  if (Array.isArray(data.employees)) {
    return data.employees.flatMap((e) =>
      (e.entries || e.timesheetEntries || []).map((entry) => ({ ...entry, employeeId: entry.employeeId ?? e.employeeId }))
    );
  }

  // Object keyed by employeeId -> array of entries.
  return Object.entries(data).flatMap(([employeeId, entries]) =>
    Array.isArray(entries) ? entries.map((entry) => ({ ...entry, employeeId: entry.employeeId ?? employeeId })) : []
  );
}

function isoWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  return monday.toISOString().slice(0, 10);
}

const WEEKLY_OT_THRESHOLD = 40; // FLSA standard; per-week, not per-pay-period

/**
 * Fetches real timesheet entries for the given date range and derives:
 * - regular/OT hours, computed the same way BambooHR's own Payroll Hours
 *   report does — total hours worked bucketed by calendar week (Mon–Sun),
 *   with hours over 40/week counted as overtime. (Holiday-worked hours
 *   aren't broken out here — that requires cross-referencing the company
 *   holiday calendar, which isn't wired up yet.)
 * - real approval status, from each entry's actual `approved` field
 *   (BambooHR tracks this natively — see the Payroll Hours report).
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

    const entries = normalizeTimesheetEntries(data);

    // employeeId -> weekKey -> total hours
    const weeklyTotals = new Map();
    // employeeId -> { anyApproved, allApproved, count }
    const approval = new Map();

    for (const entry of entries) {
      const empId = String(entry.employeeId);
      const hrs = Number(entry.hours) || 0;
      const dateStr = entry.date || entry.start?.slice(0, 10);
      if (!dateStr) continue;

      const weekKey = isoWeekKey(dateStr);
      if (!weeklyTotals.has(empId)) weeklyTotals.set(empId, new Map());
      const empWeeks = weeklyTotals.get(empId);
      empWeeks.set(weekKey, (empWeeks.get(weekKey) || 0) + hrs);

      const isApproved = entry.approved === true || Boolean(entry.approvedAt);
      const a = approval.get(empId) || { count: 0, approvedCount: 0 };
      a.count += 1;
      if (isApproved) a.approvedCount += 1;
      approval.set(empId, a);
    }

    const hoursByEmployee = new Map();
    for (const [empId, weeks] of weeklyTotals.entries()) {
      let regularHours = 0;
      let otHours = 0;
      for (const weekTotal of weeks.values()) {
        regularHours += Math.min(weekTotal, WEEKLY_OT_THRESHOLD);
        otHours += Math.max(0, weekTotal - WEEKLY_OT_THRESHOLD);
      }
      hoursByEmployee.set(empId, {
        regularHours: Math.round(regularHours * 100) / 100,
        otHours: Math.round(otHours * 100) / 100,
        holidayHours: 0, // not yet cross-referenced against company holiday calendar
      });
    }

    const approvalByEmployee = new Map();
    for (const [empId, a] of approval.entries()) {
      approvalByEmployee.set(empId, a.count > 0 && a.approvedCount === a.count ? "Approved" : "Pending");
    }

    return { hoursByEmployee, approvalByEmployee, live: true };
  } catch (err) {
    // Time Tracking not enabled / not permitted / transient failure — degrade
    // gracefully rather than failing the whole payroll view.
    return { hoursByEmployee: new Map(), approvalByEmployee: new Map(), live: false, error: err instanceof BambooHRError ? err.code : "UNKNOWN" };
  }
}

/**
 * Real multi-week payroll trend. Fetches the directory once, then fetches
 * live hours for each of the trailing `weeks` (Mon–Sun) ending at the given
 * date, in parallel. Returns per-employee cost per week (not pre-aggregated
 * by department) so the client can filter by location and re-aggregate,
 * same pattern as the main payroll dataset.
 */
export async function getPayrollTrend({ end: endISO, weeks = 6 } = {}) {
  const endDate = endISO ? new Date(endISO + "T00:00:00") : new Date();
  const day = endDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const weekOfEndMonday = new Date(endDate);
  weekOfEndMonday.setDate(endDate.getDate() + diffToMonday);

  const { employees: directory } = await cached("directory-only", fetchDirectoryWithCompensation);

  const weekRanges = Array.from({ length: weeks }, (_, i) => {
    const offset = weeks - 1 - i; // oldest first
    const weekStart = new Date(weekOfEndMonday);
    weekStart.setDate(weekOfEndMonday.getDate() - offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { weekStart, weekEnd };
  });

  const weekResults = await Promise.all(
    weekRanges.map(({ weekStart, weekEnd }) =>
      cached(`trend-week:${weekStart.toISOString().slice(0, 10)}`, async () => {
        const { hoursByEmployee } = await fetchWeeklyHours(
          directory.map((e) => e.id),
          weekStart,
          weekEnd
        );

        const employeeCosts = directory.map((e) => {
          const hours = hoursByEmployee.get(String(e.id)) || { regularHours: 0, otHours: 0, holidayHours: 0 };
          const burden = burdenRateFor(e.departmentGroup);
          const cost = computeLaborCost({ baseRate: e.baseRate, burden, ...hours });
          return {
            employeeId: e.id,
            location: e.location,
            departmentGroup: e.departmentGroup,
            regularHours: hours.regularHours,
            otHours: hours.otHours,
            holidayHours: hours.holidayHours,
            totalCost: cost.totalCost,
          };
        });

        return {
          weekLabel: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          weekStart: weekStart.toISOString().slice(0, 10),
          employeeCosts,
        };
      })
    )
  );

  return { weeks: weekResults };
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
    const { employees: directory, compensationAccessible } = await fetchDirectoryWithCompensation();
    const active = directory; // include all; UI filters by status itself
    const { hoursByEmployee, approvalByEmployee, live: hoursLive } = await fetchWeeklyHours(
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
        // Real approval status from BambooHR's own timesheet approval
        // tracking (see fetchWeeklyHours) — falls back to "Pending" when
        // there's no timesheet data to derive it from for this employee.
        approvalStatus: approvalByEmployee.get(String(e.id)) || "Pending",
      };
    });

    return {
      employees,
      departmentTotals: buildDepartmentTotals(employees),
      burdenByDepartment: buildBurdenByDepartment(employees),
      departmentGroups: buildDepartmentGroups(employees),
      grandTotal: round2(employees.reduce((sum, e) => sum + e.totalCost, 0)),
      currentPeriodTotals: buildCurrentPeriodTotals(employees),
      meta: { hoursLive, ptoLive, compensationAccessible },
    };
  });
}

