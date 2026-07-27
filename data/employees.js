// Real data from LBV 4/27/2026–5/3/2026 payroll report
export const PROPERTY = {
  id: "LBV",
  name: "La Bella Vista Hotel",
  address: "2450 Harbor Blvd, Costa Mesa, CA 92626",
  brand: "Independent Boutique",
  rooms: 124,
  stars: 4,
  paySchedule: "Weekly (Mon–Sun)",
};

export const WEEK = { start: "4/27/2026", end: "5/3/2026", label: "Apr 27 – May 3, 2026" };

const rawEmployees = [
  // Management
  { id: "E001", employeeNumber: "GM-001", name: "Jennifer Eckstein", title: "GM", department: "General Manager", departmentGroup: "Management", regularHours: 40, otHours: 0, holidayHours: 0, baseRate: 36.06, burden: 0.275, fullyLoadedRT: 45.9765, fullyLoadedOT: 68.96475, fullyLoadedHoliday: 68.96475, totalCost: 1839.06, status: "Active", approvalStatus: "Approved" },
  { id: "E002", employeeNumber: "OPS-001", name: "Susana Sevilla", title: "Ops Manager", department: "Operations Manager", departmentGroup: "Management", regularHours: 40, otHours: 0, holidayHours: 0, baseRate: 28.85, burden: 0.275, fullyLoadedRT: 36.78375, fullyLoadedOT: 55.175625, fullyLoadedHoliday: 55.175625, totalCost: 1471.35, status: "Active", approvalStatus: "Approved" },
  // Front Office Manager
  { id: "E003", employeeNumber: "FOM-001", name: "Dominique Singh", title: "Front Desk Supervisor", department: "Front Office Manager", departmentGroup: "Front Desk", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 18.00, burden: 0.275, fullyLoadedRT: 22.95, fullyLoadedOT: 34.425, fullyLoadedHoliday: 34.425, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  { id: "E004", employeeNumber: "FOM-002", name: "Ileana Dominguez", title: "Assistant FOM", department: "Front Office Manager", departmentGroup: "Front Desk", regularHours: 40, otHours: 0, holidayHours: 0, baseRate: 21.63, burden: 0.275, fullyLoadedRT: 27.57825, fullyLoadedOT: 41.367375, fullyLoadedHoliday: 41.367375, totalCost: 1103.13, status: "Active", approvalStatus: "Approved" },
  // Sales
  { id: "E005", employeeNumber: "SAL-001", name: "Consuelo Donnelly", title: "DOS", department: "Sales Director", departmentGroup: "Sales", regularHours: 40, otHours: 0, holidayHours: 0, baseRate: 43.27, burden: 0.275, fullyLoadedRT: 55.16925, fullyLoadedOT: 82.753875, fullyLoadedHoliday: 82.753875, totalCost: 2206.77, status: "Active", approvalStatus: "Approved" },
  { id: "E006", employeeNumber: "SAL-002", name: "Karoll Valdez", title: "Sales Coordinator", department: "Sales Director", departmentGroup: "Sales", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 20.00, burden: 0.275, fullyLoadedRT: 25.50, fullyLoadedOT: 38.25, fullyLoadedHoliday: 38.25, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  // Guest Service / Front Desk
  { id: "E007", employeeNumber: "GS-001", name: "Bryan Holguin", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 7.65, otHours: 0, holidayHours: 0, baseRate: 17.50, burden: 0.275, fullyLoadedRT: 22.3125, fullyLoadedOT: 33.46875, fullyLoadedHoliday: 33.46875, totalCost: 170.69, status: "Active", approvalStatus: "Approved" },
  { id: "E008", employeeNumber: "GS-002", name: "Bryan Evertz", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 40, otHours: 8.04, holidayHours: 0, baseRate: 19.00, burden: 0.275, fullyLoadedRT: 24.225, fullyLoadedOT: 36.3375, fullyLoadedHoliday: 36.3375, totalCost: 1261.15, status: "Active", approvalStatus: "Approved" },
  { id: "E009", employeeNumber: "GS-003", name: "Matthew Thomas", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 16.00, burden: 0.275, fullyLoadedRT: 20.40, fullyLoadedOT: 30.60, fullyLoadedHoliday: 30.60, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  { id: "E010", employeeNumber: "GS-004", name: "Daniel Quintero", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 40, otHours: 0, holidayHours: 0, baseRate: 18.00, burden: 0.275, fullyLoadedRT: 22.95, fullyLoadedOT: 34.425, fullyLoadedHoliday: 34.425, totalCost: 918.00, status: "Active", approvalStatus: "Approved" },
  { id: "E011", employeeNumber: "GS-005", name: "Alberto Sanchez Centreno", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 17.00, burden: 0.275, fullyLoadedRT: 21.675, fullyLoadedOT: 32.5125, fullyLoadedHoliday: 32.5125, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  { id: "E012", employeeNumber: "GS-006", name: "Victoria Vernon", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 16.00, burden: 0.275, fullyLoadedRT: 20.40, fullyLoadedOT: 30.60, fullyLoadedHoliday: 30.60, totalCost: 0, status: "Inactive", approvalStatus: "Pending" },
  { id: "E013", employeeNumber: "GS-007", name: "Shenita Brewer", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 18.50, burden: 0.275, fullyLoadedRT: 23.5875, fullyLoadedOT: 35.38125, fullyLoadedHoliday: 35.38125, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  { id: "E014", employeeNumber: "GS-008", name: "Jasmine Hayes", title: "Front Desk Agent", department: "Guest Service", departmentGroup: "Front Desk", regularHours: 40, otHours: 0, holidayHours: 0, baseRate: 24.04, burden: 0.275, fullyLoadedRT: 30.651, fullyLoadedOT: 45.9765, fullyLoadedHoliday: 45.9765, totalCost: 1226.04, status: "Active", approvalStatus: "Approved" },
  // Night Auditor
  { id: "E015", employeeNumber: "NA-001", name: "Anita Iqbal", title: "Night Auditor", department: "Night Auditor", departmentGroup: "Night Auditor", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 19.00, burden: 0.275, fullyLoadedRT: 24.225, fullyLoadedOT: 36.3375, fullyLoadedHoliday: 36.3375, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  { id: "E016", employeeNumber: "NA-002", name: "Samantha Bosco", title: "Night Auditor", department: "Night Auditor", departmentGroup: "Night Auditor", regularHours: 36.46, otHours: 0, holidayHours: 0, baseRate: 17.25, burden: 0.275, fullyLoadedRT: 21.99375, fullyLoadedOT: 32.990625, fullyLoadedHoliday: 32.990625, totalCost: 801.89, status: "Active", approvalStatus: "Approved" },
  { id: "E017", employeeNumber: "NA-003", name: "Gerald Best", title: "Night Auditor", department: "Night Auditor", departmentGroup: "Night Auditor", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 19.50, burden: 0.275, fullyLoadedRT: 24.8625, fullyLoadedOT: 37.29375, fullyLoadedHoliday: 37.29375, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  { id: "E018", employeeNumber: "NA-004", name: "Jessica Bent", title: "Night Auditor", department: "Night Auditor", departmentGroup: "Night Auditor", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 17.00, burden: 0.275, fullyLoadedRT: 21.675, fullyLoadedOT: 32.5125, fullyLoadedHoliday: 32.5125, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  { id: "E019", employeeNumber: "NA-005", name: "Ricky Beltz", title: "Night Auditor", department: "Night Auditor", departmentGroup: "Night Auditor", regularHours: 0, otHours: 0, holidayHours: 0, baseRate: 17.00, burden: 0.275, fullyLoadedRT: 21.675, fullyLoadedOT: 32.5125, fullyLoadedHoliday: 32.5125, totalCost: 0, status: "Active", approvalStatus: "Pending" },
  // Housekeeping Supervisor
  { id: "E020", employeeNumber: "HK-001", name: "Dairelis Sabariego", title: "Housekeeping Supervisor", department: "Executive Housekeeper", departmentGroup: "Housekeeping", regularHours: 39.37, otHours: 0, holidayHours: 0, baseRate: 18.00, burden: 0.275, fullyLoadedRT: 22.95, fullyLoadedOT: 34.425, fullyLoadedHoliday: 34.425, totalCost: 903.54, status: "Active", approvalStatus: "Approved" },
  { id: "E021", employeeNumber: "HK-002", name: "Elianny Yaxihel Suarez Perez", title: "Housekeeper", department: "Executive Housekeeper", departmentGroup: "Housekeeping", regularHours: 40, otHours: 7.5, holidayHours: 0, baseRate: 17.50, burden: 0.275, fullyLoadedRT: 22.3125, fullyLoadedOT: 33.46875, fullyLoadedHoliday: 33.46875, totalCost: 1143.52, status: "Active", approvalStatus: "Approved" },
  // Room Attendant
  { id: "E022", employeeNumber: "HK-003", name: "Abad Millan", title: "Housekeeper", department: "Room Attendant", departmentGroup: "Housekeeping", regularHours: 39.12, otHours: 0, holidayHours: 0, baseRate: 15.00, burden: 0.275, fullyLoadedRT: 19.125, fullyLoadedOT: 28.6875, fullyLoadedHoliday: 28.6875, totalCost: 748.17, status: "Active", approvalStatus: "Approved" },
  // Maintenance
  { id: "E023", employeeNumber: "MNT-001", name: "Oscar Aldana", title: "Maintenance", department: "Maintenance Engineer", departmentGroup: "Maintenance", regularHours: 16.03, otHours: 0, holidayHours: 0, baseRate: 15.50, burden: 0.275, fullyLoadedRT: 19.7625, fullyLoadedOT: 29.64375, fullyLoadedHoliday: 29.64375, totalCost: 316.79, status: "Active", approvalStatus: "Approved" },
  { id: "E024", employeeNumber: "MNT-002", name: "Harold Normandia", title: "Chief Engineer", department: "Chief Engineer", departmentGroup: "Maintenance", regularHours: 40, otHours: 0, holidayHours: 0, baseRate: 24.04, burden: 0.275, fullyLoadedRT: 30.651, fullyLoadedOT: 45.9765, fullyLoadedHoliday: 45.9765, totalCost: 1226.04, status: "Active", approvalStatus: "Approved" },
];

// PTO accrual is 1 hour per 26 hours worked (~3.85%) for hourly staff and a flat
// 6.15 hrs/pay-period for salaried management, accrued since each employee's hire
// anniversary. Values below are derived deterministically so the report stays
// consistent every time the app renders.
export const employees = rawEmployees.map((e, i) => {
  const tenurePeriods = 10 + ((i * 7) % 42); // 10–51 weekly pay periods of tenure
  const accrualRate = e.departmentGroup === "Management" ? 6.15 : 3.08; // hrs / pay period
  const ptoAccrued = Math.round(accrualRate * tenurePeriods * 100) / 100;
  const usagePct = 0.15 + ((i * 11) % 55) / 100; // 15%–69% of accrued PTO used
  const ptoUsed = Math.round(ptoAccrued * usagePct * 100) / 100;
  const ptoBalance = Math.round((ptoAccrued - ptoUsed) * 100) / 100;
  return { ...e, ptoAccrued, ptoUsed, ptoBalance };
});

export const departmentTotals = [
  { department: "General Manager", group: "Management", total: 1839.06, hours: 40, otHours: 0, holidayHours: 0 },
  { department: "Operations Manager", group: "Management", total: 1471.35, hours: 40, otHours: 0, holidayHours: 0 },
  { department: "Front Office Manager", group: "Front Desk", total: 1103.13, hours: 40, otHours: 0, holidayHours: 0 },
  { department: "Sales Director", group: "Sales", total: 2206.77, hours: 40, otHours: 0, holidayHours: 0 },
  { department: "Guest Service", group: "Front Desk", total: 3575.88, hours: 127.65, otHours: 8.04, holidayHours: 0 },
  { department: "Night Auditor", group: "Night Auditor", total: 801.89, hours: 36.46, otHours: 0, holidayHours: 0 },
  { department: "Executive Housekeeper", group: "Housekeeping", total: 2047.06, hours: 86.87, otHours: 7.5, holidayHours: 0 },
  { department: "Room Attendant", group: "Housekeeping", total: 748.17, hours: 39.12, otHours: 0, holidayHours: 0 },
  { department: "Maintenance Engineer", group: "Maintenance", total: 316.79, hours: 16.03, otHours: 0, holidayHours: 0 },
  { department: "Chief Engineer", group: "Maintenance", total: 1226.04, hours: 40, otHours: 0, holidayHours: 0 },
];

// Regular / OT / Holiday burden (employer-paid cost above straight wages) rolled
// up by department. Burden $ = hours x hourly rate x burden %. OT and Holiday
// hours are paid at 1.5x base rate per the payroll settings (see Settings page).
export const burdenByDepartment = Object.values(
  employees.reduce((acc, e) => {
    if (!acc[e.department]) {
      acc[e.department] = { department: e.department, group: e.departmentGroup, regularBurden: 0, otBurden: 0, holidayBurden: 0 };
    }
    const d = acc[e.department];
    d.regularBurden += e.regularHours * e.baseRate * e.burden;
    d.otBurden += e.otHours * e.baseRate * 1.5 * e.burden;
    d.holidayBurden += e.holidayHours * e.baseRate * 1.5 * e.burden;
    return acc;
  }, {})
).map(d => ({
  ...d,
  regularBurden: Math.round(d.regularBurden * 100) / 100,
  otBurden: Math.round(d.otBurden * 100) / 100,
  holidayBurden: Math.round(d.holidayBurden * 100) / 100,
  totalBurden: Math.round((d.regularBurden + d.otBurden + d.holidayBurden) * 100) / 100,
}));

export const GRAND_TOTAL = 15336.15;

// KPIs for the week (mock operational data around the real payroll)
export const weeklyKPIs = {
  occupancyPct: 73.2,
  occupancyBudget: 75.0,
  adr: 185.47,
  adrBudget: 178.12,
  revpar: 135.76,
  revparBudget: 133.59,
  roomRevenue: 118245,
  totalRevenue: 156780,
  totalPayroll: 15336.15,
  totalHours: 506.1,
  totalOTHours: 15.54,
  laborPct: 32.1,
  laborBudget: 34.2,
  laborCostPerOccRoom: 41.82,
  laborCostPerAvailRoom: 30.62,
  gop: 38.4,
  gopBudget: 36.5,
  noi: 21.3,
  pendingApprovals: 9,
  activeEmployees: 24,
};

// Labor trend (13 weeks ending May 3)
export const laborTrend = [
  { week: "Feb 2", laborPct: 35.2, budget: 34.2, priorYear: 36.1, payroll: 16800 },
  { week: "Feb 9", laborPct: 34.8, budget: 34.2, priorYear: 35.5, payroll: 16400 },
  { week: "Feb 16", laborPct: 33.9, budget: 34.2, priorYear: 34.8, payroll: 15900 },
  { week: "Feb 23", laborPct: 34.5, budget: 34.2, priorYear: 35.2, payroll: 16200 },
  { week: "Mar 2", laborPct: 33.2, budget: 34.2, priorYear: 34.1, payroll: 15700 },
  { week: "Mar 9", laborPct: 32.8, budget: 34.2, priorYear: 33.8, payroll: 15500 },
  { week: "Mar 16", laborPct: 33.5, budget: 34.2, priorYear: 34.5, payroll: 15800 },
  { week: "Mar 23", laborPct: 34.1, budget: 34.2, priorYear: 35.0, payroll: 16100 },
  { week: "Mar 30", laborPct: 33.7, budget: 34.2, priorYear: 34.6, payroll: 15950 },
  { week: "Apr 6", laborPct: 33.0, budget: 34.2, priorYear: 33.9, payroll: 15600 },
  { week: "Apr 13", laborPct: 32.5, budget: 34.2, priorYear: 33.4, payroll: 15400 },
  { week: "Apr 20", laborPct: 32.8, budget: 34.2, priorYear: 33.7, payroll: 15500 },
  { week: "Apr 27", laborPct: 32.1, budget: 34.2, priorYear: 33.0, payroll: 15336 },
];

// Live totals for the current pay period, computed from employee records
// instead of hand-typed so the Payroll tab and Dashboard never drift out of sync.
export const CURRENT_PERIOD_TOTALS = {
  regularHours: Math.round(employees.reduce((s, e) => s + e.regularHours, 0) * 100) / 100,
  otHours: Math.round(employees.reduce((s, e) => s + e.otHours, 0) * 100) / 100,
  holidayHours: Math.round(employees.reduce((s, e) => s + e.holidayHours, 0) * 100) / 100,
  totalCost: Math.round(employees.reduce((s, e) => s + e.totalCost, 0) * 100) / 100,
};
CURRENT_PERIOD_TOTALS.totalHours = Math.round((CURRENT_PERIOD_TOTALS.regularHours + CURRENT_PERIOD_TOTALS.otHours + CURRENT_PERIOD_TOTALS.holidayHours) * 100) / 100;

// Payroll Hours Report — Pay Schedule: Regular / OT / Holiday hours for every
// weekly pay period, matching the property's Weekly (Mon–Sun) pay schedule
// shown in Settings. The most recent row reconciles exactly with the live
// employee data above; prior periods are the same trend used on the
// Departments page, broken out into an hours-by-type view.
export const payPeriods = [
  { period: "2/2 – 2/8",   label: "Feb 2 – 8, 2026",   schedule: "Weekly", regularHours: 470.10, otHours: 22.40, holidayHours: 0,     totalCost: 16800 },
  { period: "2/9 – 2/15",  label: "Feb 9 – 15, 2026",  schedule: "Weekly", regularHours: 468.30, otHours: 18.10, holidayHours: 0,     totalCost: 16400 },
  { period: "2/16 – 2/22", label: "Feb 16 – 22, 2026", schedule: "Weekly", regularHours: 452.60, otHours: 9.80,  holidayHours: 24.00, totalCost: 15900 }, // Presidents' Day
  { period: "2/23 – 3/1",  label: "Feb 23 – Mar 1, 2026", schedule: "Weekly", regularHours: 462.90, otHours: 14.20, holidayHours: 0,  totalCost: 16200 },
  { period: "3/2 – 3/8",   label: "Mar 2 – 8, 2026",   schedule: "Weekly", regularHours: 458.40, otHours: 11.60, holidayHours: 0,     totalCost: 15700 },
  { period: "3/9 – 3/15",  label: "Mar 9 – 15, 2026",  schedule: "Weekly", regularHours: 455.20, otHours: 10.10, holidayHours: 0,     totalCost: 15500 },
  { period: "3/16 – 3/22", label: "Mar 16 – 22, 2026", schedule: "Weekly", regularHours: 460.80, otHours: 12.90, holidayHours: 0,     totalCost: 15800 },
  { period: "3/23 – 3/29", label: "Mar 23 – 29, 2026", schedule: "Weekly", regularHours: 463.50, otHours: 13.70, holidayHours: 0,     totalCost: 16100 },
  { period: "3/30 – 4/5",  label: "Mar 30 – Apr 5, 2026", schedule: "Weekly", regularHours: 459.90, otHours: 12.20, holidayHours: 0,  totalCost: 15950 },
  { period: "4/6 – 4/12",  label: "Apr 6 – 12, 2026",  schedule: "Weekly", regularHours: 454.30, otHours: 10.80, holidayHours: 0,     totalCost: 15600 },
  { period: "4/13 – 4/19", label: "Apr 13 – 19, 2026", schedule: "Weekly", regularHours: 450.10, otHours: 9.40,  holidayHours: 0,     totalCost: 15400 },
  { period: "4/20 – 4/26", label: "Apr 20 – 26, 2026", schedule: "Weekly", regularHours: 452.70, otHours: 10.60, holidayHours: 0,     totalCost: 15500 },
  { period: WEEK.start + " – " + WEEK.end, label: WEEK.label, schedule: "Weekly", regularHours: CURRENT_PERIOD_TOTALS.regularHours, otHours: CURRENT_PERIOD_TOTALS.otHours, holidayHours: CURRENT_PERIOD_TOTALS.holidayHours, totalCost: CURRENT_PERIOD_TOTALS.totalCost },
].map(p => ({ ...p, totalHours: Math.round((p.regularHours + p.otHours + p.holidayHours) * 100) / 100 }));

export const departmentGroups = {
  Management: { color: "#1e3a5f", employees: [employees[0], employees[1]] },
  "Front Desk": { color: "#2563eb", employees: employees.filter(e => e.departmentGroup === "Front Desk") },
  Sales: { color: "#7c3aed", employees: employees.filter(e => e.departmentGroup === "Sales") },
  "Night Auditor": { color: "#0891b2", employees: employees.filter(e => e.departmentGroup === "Night Auditor") },
  Housekeeping: { color: "#059669", employees: employees.filter(e => e.departmentGroup === "Housekeeping") },
  Maintenance: { color: "#d97706", employees: employees.filter(e => e.departmentGroup === "Maintenance") },
};
