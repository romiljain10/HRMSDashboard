import { getDb } from "@/lib/db/mongodb";

/**
 * Collection schemas (documented here since MongoDB itself enforces none
 * of this — every write path should conform to these shapes).
 *
 * revenue_snapshots — one document per upload, per property, per period.
 * History is preserved (never overwritten) so corrections are auditable;
 * "current" value for a period is whichever has the latest uploadedAt.
 *   {
 *     property: string,          // matches a BambooHR location name, for joins
 *     periodStart: "YYYY-MM-DD",
 *     periodEnd: "YYYY-MM-DD",
 *     occupancyPct: number,      // e.g. 0.7325 for 73.25%
 *     adr: number,
 *     revpar: number,
 *     roomRevenue: number,
 *     totalRevenue: number,
 *     bookedRooms: number,       // its own uploaded column, not derived
 *     uploadedBy: string,        // username
 *     uploadedAt: ISODate,
 *     sourceFileName: string,    // audit trail — original upload's filename
 *     notes: string | null,
 *   }
 *
 * tips (displayed as "Gratuity") — one document per employee per property
 * per week. employeeId is resolved by matching employeeName against the
 * live BambooHR directory for that property at entry time — null if no
 * confident match was found (flagged as a warning, not silently dropped).
 * total = amount × (1 + burdenPct/100), computed server-side.
 *   {
 *     property: string,
 *     employeeName: string,
 *     employeeId: string | null,
 *     amount: number,
 *     burdenPct: number,
 *     total: number,
 *     weekStart: "YYYY-MM-DD",
 *     weekEnd: "YYYY-MM-DD",
 *     enteredBy: string,
 *     enteredAt: ISODate,
 *     sourceFileName: string | null,
 *   }
 *
 * bonuses — same shape as tips, separate collection.
 *
 * report_subscriptions — scheduled report deliveries.
 *   {
 *     reportKey: string,         // matches lib/reports/catalog.js keys
 *     recipients: string[],      // email addresses
 *     frequency: "weekly" | "monthly",
 *     dayOfWeek: number | null,  // 0-6, for weekly
 *     dayOfMonth: number | null, // 1-31, for monthly
 *     format: "CSV" | "XLSX" | "PDF",
 *     active: boolean,
 *     createdBy: string,
 *     createdAt: ISODate,
 *     lastSentAt: ISODate | null,
 *   }
 *
 * payroll_approvals — our own internal approve/reject workflow, layered on
 * top of (never written back to) BambooHR's own read-only approval status.
 *   {
 *     employeeId: string,        // BambooHR employee id
 *     periodStart: "YYYY-MM-DD",
 *     periodEnd: "YYYY-MM-DD",
 *     status: "Approved" | "Rejected" | "Pending",
 *     actedBy: string,           // username
 *     actedAt: ISODate,
 *     note: string | null,
 *   }
 *
 * state_burden_rates — one document per US state with a configured
 * burden %. States with no document here fall back to the existing
 * department-group-based burdenRateFor() logic (see lib/payroll/config.js).
 *   {
 *     state: string,        // e.g. "Montana" — matches lib/payroll/usStates.js
 *     burdenPct: number,    // e.g. 27.5 for 27.5%
 *     updatedBy: string,
 *     updatedAt: ISODate,
 *   }
 *
 * property_states — which US state each property/location is in, so
 * state_burden_rates can be looked up per employee via their location.
 *   {
 *     property: string,     // matches a BambooHR location name exactly
 *     state: string,
 *     updatedBy: string,
 *     updatedAt: ISODate,
 *   }
 *
 * users — replaces the USERS_JSON env var once self-service management
 * ships. Passwords are hashed (never plain text, unlike the env-var days).
 *   {
 *     username: string,          // unique
 *     passwordHash: string,
 *     name: string,
 *     role: "Admin" | "Payroll Manager" | "Viewer",
 *     active: boolean,
 *     createdAt: ISODate,
 *     createdBy: string | null,  // null for accounts imported from USERS_JSON
 *   }
 */

export async function getRevenueSnapshotsCollection() {
  return (await getDb()).collection("revenue_snapshots");
}

export async function getTipsCollection() {
  return (await getDb()).collection("tips");
}

export async function getBonusesCollection() {
  return (await getDb()).collection("bonuses");
}

export async function getStateBurdenRatesCollection() {
  return (await getDb()).collection("state_burden_rates");
}

export async function getPropertyStatesCollection() {
  return (await getDb()).collection("property_states");
}

export async function getReportSubscriptionsCollection() {
  return (await getDb()).collection("report_subscriptions");
}

export async function getPayrollApprovalsCollection() {
  return (await getDb()).collection("payroll_approvals");
}

export async function getUsersCollection() {
  return (await getDb()).collection("users");
}

/**
 * Creates all indexes this app relies on. Safe to call repeatedly —
 * createIndex is a no-op if the index already exists with the same spec.
 * Called from the health-check route and can be re-run any time.
 */
export async function ensureIndexes() {
  const db = await getDb();

  await db.collection("revenue_snapshots").createIndex(
    { property: 1, periodStart: 1, uploadedAt: -1 },
    { name: "property_period_uploaded" }
  );

  await db.collection("tips").createIndex(
    { property: 1, employeeName: 1, weekStart: 1 },
    { name: "property_employee_week" }
  );
  await db.collection("tips").createIndex({ employeeId: 1, weekStart: 1 }, { name: "employee_week" });

  await db.collection("bonuses").createIndex(
    { property: 1, employeeName: 1, weekStart: 1 },
    { name: "property_employee_week" }
  );
  await db.collection("bonuses").createIndex({ employeeId: 1, weekStart: 1 }, { name: "employee_week" });

  await db.collection("report_subscriptions").createIndex(
    { active: 1 },
    { name: "active_subscriptions" }
  );

  await db.collection("payroll_approvals").createIndex(
    { employeeId: 1, periodStart: 1 },
    { name: "employee_period" }
  );

  await db.collection("users").createIndex(
    { username: 1 },
    { name: "unique_username", unique: true }
  );

  await db.collection("state_burden_rates").createIndex(
    { state: 1 },
    { name: "unique_state", unique: true }
  );
  await db.collection("property_states").createIndex(
    { property: 1 },
    { name: "unique_property", unique: true }
  );

  return { ok: true };
}
