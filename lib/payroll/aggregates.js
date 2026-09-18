import { round2 } from "@/lib/payroll/config";

export function buildDepartmentTotals(employees) {
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
    d.total += e.totalCost + (e.ptoCost || 0);
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

export function buildBurdenByDepartment(employees) {
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

export function buildCurrentPeriodTotals(employees) {
  const totals = {
    regularHours: round2(employees.reduce((s, e) => s + e.regularHours, 0)),
    otHours: round2(employees.reduce((s, e) => s + e.otHours, 0)),
    holidayHours: round2(employees.reduce((s, e) => s + e.holidayHours, 0)),
    totalCost: round2(employees.reduce((s, e) => s + e.totalCost + (e.ptoCost || 0), 0)),
  };
  totals.totalHours = round2(totals.regularHours + totals.otHours + totals.holidayHours);
  return totals;
}

export function buildDepartmentGroups(employees) {
  const groups = {};
  for (const e of employees) {
    if (!groups[e.departmentGroup]) groups[e.departmentGroup] = [];
    groups[e.departmentGroup].push(e);
  }
  return groups;
}
