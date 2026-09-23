// Flat, searchable list of every report — kept in one place so the Reports
// hub page and the global header search both work off the same data.
export const REPORTS_CATALOG = [
  { key: "weekly-payroll-detail", name: "Weekly Payroll Detail", category: "Payroll Reports", href: "/payroll" },
  { key: "payroll-hours-schedule", name: "Payroll Hours Report — Pay Schedule", category: "Payroll Reports", href: "/reports/payroll-hours" },
  { key: "department-payroll-rollup", name: "Department Payroll Rollup", category: "Payroll Reports", href: "/departments" },
  { key: "labor-burden", name: "Labor Burden Report — Reg/OT/Holiday", category: "Payroll Reports", href: "/payroll#burden-breakdown" },
  { key: "payroll-history-summary", name: "Payroll History Summary", category: "Payroll Reports", href: "/reports/payroll-hours" },
  { key: "overtime-exception", name: "Overtime Exception Report", category: "Payroll Reports", href: "/reports" },
  { key: "salary-distribution", name: "Salary Distribution Report", category: "Payroll Reports", href: "/reports" },
  { key: "employee-directory-export", name: "Employee Directory Export", category: "Employee Reports", href: "/employees" },
  { key: "employee-status", name: "Employee Status Report", category: "Employee Reports", href: "/reports" },
  { key: "payroll-approval-status", name: "Payroll Approval Status", category: "Employee Reports", href: "/reports" },
  { key: "department-headcount", name: "Department Headcount Report", category: "Department Reports", href: "/departments" },
  { key: "department-cost-analysis", name: "Department Cost Analysis", category: "Department Reports", href: "/departments" },
  { key: "hours-worked-summary", name: "Hours Worked Summary", category: "Attendance Reports", href: "/reports/payroll-hours" },
  { key: "pto-report", name: "Paid Time Off (PTO) Report", category: "Attendance Reports", href: "/reports/pto" },
  { key: "missing-hours", name: "Missing Hours Report", category: "Attendance Reports", href: "/reports" },
  // Reminders — not file exports; scheduling these emails a nudge instead
  // of an attachment, checking whether revenue/tips have been entered yet.
  { key: "revenue-reminder", name: "Revenue Entry Reminder", category: "Reminders", href: "/revenue", isReminder: true },
  { key: "tips-reminder", name: "Tips Entry Reminder", category: "Reminders", href: "/revenue", isReminder: true },
];
