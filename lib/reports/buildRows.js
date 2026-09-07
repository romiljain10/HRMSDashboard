
// Each entry returns { columns: [...headers], rows: [[...values], ...] }
// built from the live dataset (data from useFilteredPayrollDataset). The
// two historical multi-week reports take an additional `weeklyTotals`
// array (from useWeeklyTrend) — real BambooHR data for each of the last
// N weeks, not the static placeholder this used to read from.
export function buildReportRows(reportKey, data, weeklyTotals = []) {
  const employees = data?.employees ?? [];
  const departmentTotals = data?.departmentTotals ?? [];
  const burdenByDepartment = data?.burdenByDepartment ?? [];

  switch (reportKey) {
    case "weekly-payroll-detail":
      return {
        columns: ["Employee #", "Name", "Title", "Department", "Location", "Status", "Reg Hrs", "OT Hrs", "Holiday Hrs", "Base Pay Rate", "Fully Loaded RT", "Total Cost", "Approval"],
        rows: employees.map(e => [e.employeeNumber, e.name, e.title, e.department, e.location, e.status, e.regularHours, e.otHours, e.holidayHours, e.baseRate, e.fullyLoadedRT, e.totalCost, e.approvalStatus]),
      };

    case "payroll-hours-schedule":
      return {
        columns: ["Week", "Regular Hrs", "OT Hrs", "Holiday Hrs", "Total Hrs", "Total Cost"],
        rows: weeklyTotals.map(w => [w.weekLabel, w.regularHours, w.otHours, w.holidayHours, +(w.regularHours + w.otHours + w.holidayHours).toFixed(2), w.totalCost]),
      };

    case "department-payroll-rollup":
      return {
        columns: ["Group", "Department", "Hours", "OT Hrs", "Holiday Hrs", "Payroll Cost"],
        rows: departmentTotals.map(d => [d.group, d.department, d.hours, d.otHours, d.holidayHours, d.total]),
      };

    case "labor-burden":
      return {
        columns: ["Group", "Department", "Regular Burden", "OT Burden", "Holiday Burden", "Total Burden"],
        rows: burdenByDepartment.map(d => [d.group, d.department, d.regularBurden, d.otBurden, d.holidayBurden, d.totalBurden]),
      };

    case "payroll-history-summary":
      return {
        columns: ["Week", "Regular Hrs", "OT Hrs", "Holiday Hrs", "Total Cost"],
        rows: weeklyTotals.map(w => [w.weekLabel, w.regularHours, w.otHours, w.holidayHours, w.totalCost]),
      };

    case "overtime-exception":
      return {
        columns: ["Employee #", "Name", "Department", "OT Hrs", "Base Rate", "Fully Loaded OT Rate", "OT Cost"],
        rows: employees.filter(e => e.otHours > 0).map(e => [e.employeeNumber, e.name, e.department, e.otHours, e.baseRate, e.fullyLoadedOT, +(e.otHours * e.fullyLoadedOT).toFixed(2)]),
      };

    case "salary-distribution":
      return {
        columns: ["Employee #", "Name", "Department", "Pay Type", "Base Rate ($/hr)", "Fully Loaded Rate ($/hr)"],
        rows: employees.map(e => [e.employeeNumber, e.name, e.department, e.payType, e.baseRate, e.fullyLoadedRT]),
      };

    case "employee-directory-export":
      return {
        columns: ["Employee #", "Name", "Title", "Department", "Location", "Status", "Hire Date"],
        rows: employees.map(e => [e.employeeNumber, e.name, e.title, e.department, e.location, e.status, e.hireDate || ""]),
      };

    case "employee-status": {
      const active = employees.filter(e => e.status === "Active").length;
      const inactive = employees.length - active;
      return {
        columns: ["Employee #", "Name", "Status", "Department", "Employment Type"],
        rows: [
          ["", "— Summary —", `Active: ${active}`, `Inactive: ${inactive}`, `Total: ${employees.length}`],
          ...employees.map(e => [e.employeeNumber, e.name, e.status, e.department, "Full-Time"]),
        ],
      };
    }

    case "payroll-approval-status":
      return {
        columns: ["Employee #", "Name", "Department", "Approval Status", "Total Cost"],
        rows: employees.map(e => [e.employeeNumber, e.name, e.department, e.approvalStatus, e.totalCost]),
      };

    case "department-headcount": {
      const counts = employees.reduce((acc, e) => {
        acc[e.departmentGroup] = (acc[e.departmentGroup] || 0) + 1;
        return acc;
      }, {});
      return {
        columns: ["Department Group", "Headcount", "Hours", "Payroll Cost"],
        rows: Object.entries(counts).map(([group, count]) => {
          const dept = departmentTotals.find(d => d.group === group);
          return [group, count, dept?.hours ?? 0, dept?.total ?? 0];
        }),
      };
    }

    case "department-cost-analysis":
      return {
        columns: ["Group", "Department", "Total Cost", "Hours", "Cost / Hour", "OT Hrs", "OT %"],
        rows: departmentTotals.map(d => {
          const totalHrs = d.hours + d.otHours + d.holidayHours;
          const costPerHour = totalHrs > 0 ? +(d.total / totalHrs).toFixed(2) : 0;
          const otPct = totalHrs > 0 ? +((d.otHours / totalHrs) * 100).toFixed(1) : 0;
          return [d.group, d.department, d.total, d.hours, costPerHour, d.otHours, otPct + "%"];
        }),
      };

    case "hours-worked-summary":
      return {
        columns: ["Employee #", "Name", "Department", "Regular Hrs", "OT Hrs", "Holiday Hrs", "Total Hrs"],
        rows: employees.map(e => [e.employeeNumber, e.name, e.department, e.regularHours, e.otHours, e.holidayHours, +(e.regularHours + e.otHours + e.holidayHours).toFixed(2)]),
      };

    case "pto-report":
      return {
        columns: ["Employee #", "Name", "Department", "PTO Accrued", "PTO Used", "PTO Balance"],
        rows: employees.map(e => [e.employeeNumber, e.name, e.department, e.ptoAccrued, e.ptoUsed, e.ptoBalance]),
      };

    case "missing-hours":
      return {
        columns: ["Employee #", "Name", "Department", "Status"],
        rows: employees.filter(e => e.status === "Active" && e.regularHours + e.otHours + e.holidayHours === 0).map(e => [e.employeeNumber, e.name, e.department, e.status]),
      };

    default:
      return { columns: [], rows: [] };
  }
}
