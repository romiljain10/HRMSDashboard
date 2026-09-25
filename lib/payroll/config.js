// Local payroll business rules. BambooHR has no concept of "burden %" or
// "fully loaded rate" — this is this app's own labor-cost logic, applied on
// top of live BambooHR employee + pay-rate data.

export const DEFAULT_BURDEN_RATE = 0.275; // employer-paid overhead as % of wages
export const OT_MULTIPLIER = 1.5;
export const HOLIDAY_MULTIPLIER = 1.5;

// Burden rate override per departmentGroup, if it ever needs to vary.
export const BURDEN_BY_GROUP = {
  // "Management": 0.30,
};

export function burdenRateFor(departmentGroup) {
  return BURDEN_BY_GROUP[departmentGroup] ?? DEFAULT_BURDEN_RATE;
}

// BambooHR "department" values -> this app's coarser "departmentGroup"
// buckets used for rollups/charts. Extend this map as your BambooHR
// department list is finalized; anything unmapped falls back to itself.
export const DEPARTMENT_GROUP_MAP = {
  "General Manager": "Management",
  "Operations Manager": "Management",
  "Front Office Manager": "Front Desk",
  "Guest Service": "Front Desk",
  "Sales Director": "Sales",
  "Night Auditor": "Night Auditor",
  "Executive Housekeeper": "Housekeeping",
  "Room Attendant": "Housekeeping",
  "Maintenance Engineer": "Maintenance",
  "Chief Engineer": "Maintenance",
};

export function departmentGroupFor(department) {
  return DEPARTMENT_GROUP_MAP[department] ?? department ?? "Unassigned";
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Computes the fully-loaded rates + weekly cost for one employee given
 * base rate + hours. Mirrors the formulas previously hard-coded in
 * data/employees.js so downstream pages don't need to change their math.
 *
 * `holidayMultiplier` lets a caller use a specific holiday's own configured
 * multiplier (from BambooHR) instead of the generic default — falls back
 * to HOLIDAY_MULTIPLIER when not given. `holidayCostOverride`, if provided,
 * is used directly as the holiday cost instead of holidayHours × rate —
 * needed when an employee's holiday hours are a mix of different pay
 * modes (worked-on-holiday-at-a-multiplier vs. a fixed allotment paid at
 * the regular rate) that a single multiplier can't represent.
 */
export function computeLaborCost({ baseRate, burden, regularHours, otHours, holidayHours, holidayMultiplier, holidayCostOverride }) {
  const fullyLoadedRT = round2(baseRate * (1 + burden));
  const fullyLoadedOT = round2(baseRate * OT_MULTIPLIER * (1 + burden));
  const fullyLoadedHoliday = round2(baseRate * (holidayMultiplier ?? HOLIDAY_MULTIPLIER) * (1 + burden));
  const holidayCost = holidayCostOverride != null ? holidayCostOverride : holidayHours * fullyLoadedHoliday;
  const totalCost = round2(
    regularHours * fullyLoadedRT + otHours * fullyLoadedOT + holidayCost
  );
  return { fullyLoadedRT, fullyLoadedOT, fullyLoadedHoliday, totalCost };
}
