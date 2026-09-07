"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { Download, FileText, Calendar, BarChart2, Users, DollarSign, Clock, Grid3X3, CalendarClock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { buildReportRows } from "@/lib/reports/buildRows";
import { exportCSV, exportXLSX, exportPDF } from "@/lib/reports/exportFile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useWeeklyTrend } from "@/hooks/useWeeklyTrend";

const reports = [
  {
    category: "Payroll Reports",
    items: [
      { key: "weekly-payroll-detail",      name: "Weekly Payroll Detail",       desc: "Full employee payroll breakdown with hours, rates, burden, and totals by department", icon: DollarSign, color: "#2563eb", formats: ["XLSX","CSV","PDF"], href: "/payroll" },
      { key: "payroll-hours-schedule",     name: "Payroll Hours Report — Pay Schedule", desc: "Regular, overtime, and holiday hours for every weekly pay period, plus current-period detail", icon: CalendarClock, color: "#0891b2", formats: ["XLSX","CSV","PDF"], href: "/reports/payroll-hours" },
      { key: "department-payroll-rollup",  name: "Department Payroll Rollup",   desc: "Summarized payroll costs by department with variance vs budget",                      icon: BarChart2,  color: "#7c3aed", formats: ["XLSX","CSV","PDF"], href: "/departments" },
      { key: "labor-burden",               name: "Labor Burden Report — Reg/OT/Holiday", desc: "Regular, OT, and holiday burden cost broken out by department",              icon: DollarSign, color: "#059669", formats: ["XLSX","CSV","PDF"], href: "/payroll#burden-breakdown" },
      { key: "payroll-history-summary",    name: "Payroll History Summary",     desc: "Month-over-month payroll trends, total cost, and headcount changes",                  icon: FileText,   color: "#0891b2", formats: ["XLSX","CSV","PDF"] },
      { key: "overtime-exception",         name: "Overtime Exception Report",   desc: "All employees with OT hours, rates, and cost impact for the period",                  icon: Clock,      color: "#dc2626", formats: ["XLSX","CSV","PDF"] },
      { key: "salary-distribution",        name: "Salary Distribution Report",  desc: "Pay rate distribution, burden breakdown, and fully-loaded cost analysis",             icon: DollarSign, color: "#059669", formats: ["XLSX","CSV","PDF"] },
    ],
  },
  {
    category: "Employee Reports",
    items: [
      { key: "employee-directory-export",  name: "Employee Directory Export",   desc: "Complete employee list with department, title, status, and pay rate information",     icon: Users,      color: "#2563eb", formats: ["XLSX","CSV"], href: "/employees" },
      { key: "employee-status",            name: "Employee Status Report",      desc: "Active vs inactive headcount, department assignments, and employment type breakdown",  icon: Users,      color: "#7c3aed", formats: ["XLSX","CSV","PDF"] },
      { key: "payroll-approval-status",    name: "Payroll Approval Status",     desc: "Pending, approved, and flagged payroll records for the current period",               icon: FileText,   color: "#d97706", formats: ["XLSX","CSV","PDF"] },
    ],
  },
  {
    category: "Department Reports",
    items: [
      { key: "department-headcount",       name: "Department Headcount Report", desc: "Employee count, hours worked, and payroll cost per department",                        icon: Grid3X3,    color: "#059669", formats: ["XLSX","CSV","PDF"], href: "/departments" },
      { key: "department-cost-analysis",   name: "Department Cost Analysis",    desc: "Cost per employee, cost per hour, and OT percentage by department",                    icon: BarChart2,  color: "#2563eb", formats: ["XLSX","CSV","PDF"], href: "/departments" },
    ],
  },
  {
    category: "Attendance Reports",
    items: [
      { key: "hours-worked-summary",       name: "Hours Worked Summary",        desc: "Regular, overtime, and holiday hours by employee and department",                      icon: Clock,      color: "#0891b2", formats: ["XLSX","CSV","PDF"], href: "/reports/payroll-hours" },
      { key: "pto-report",                 name: "Paid Time Off (PTO) Report",  desc: "PTO accrued, used, and remaining balance by employee, with low-balance flags",         icon: CalendarClock, color: "#7c3aed", formats: ["XLSX","CSV","PDF"], href: "/reports/pto" },
      { key: "missing-hours",              name: "Missing Hours Report",        desc: "Employees with zero hours logged during the current payroll period",                   icon: Clock,      color: "#dc2626", formats: ["XLSX","CSV","PDF"] },
    ],
  },
];

export default function ReportsPage() {
  const { data, loading, locations, location } = useFilteredPayrollDataset();
  const { start, end } = useDateRange();
  const { user: currentUser } = useCurrentUser();
  const canExport = !currentUser || currentUser.role !== "Viewer";
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const [emptyNotice, setEmptyNotice] = useState(null);
  const HISTORICAL_KEYS = ["payroll-hours-schedule", "payroll-history-summary"];
  const { weeklyTotals, loading: trendLoading } = useWeeklyTrend(13);

  function handleExport(report, format) {
    const isHistorical = HISTORICAL_KEYS.includes(report.key);
    if (loading || !data || (isHistorical && trendLoading)) return;
    const { columns, rows } = buildReportRows(report.key, data, isHistorical ? weeklyTotals : undefined);
    if (rows.length === 0) {
      setEmptyNotice(report.key);
      setTimeout(() => setEmptyNotice((k) => (k === report.key ? null : k)), 4000);
      return;
    }
    if (format === "CSV") exportCSV(report.name, columns, rows);
    else if (format === "XLSX") exportXLSX(report.name, columns, rows);
    else if (format === "PDF") exportPDF(report.name, columns, rows, `${location} | ${formatDateRangeLabel(start, end)}`);
  }

  return (
    <AppLayout>
      <Header title="Reports" subtitle={`${location}  |  Payroll, Employee & Department Reports`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>
        {reports.map((cat, ci) => (
          <div key={ci} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{cat.category}</div>
            <div className="grid-2col">
              {cat.items.map((report, ri) => (
                <div key={ri} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16, display: "flex", gap: 12 }}>
                  <div style={{ background: report.color + "12", borderRadius: 8, padding: 9, alignSelf: "flex-start", flexShrink: 0 }}>
                    <report.icon size={16} color={report.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {report.href ? (
                      <Link href={report.href} style={{ textDecoration: "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#2563eb", marginBottom: 3 }}>
                          {report.name} <ArrowRight size={12} />
                        </div>
                      </Link>
                    ) : (
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>{report.name}</div>
                    )}
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>{report.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {canExport ? report.formats.map(fmt => {
                        const isDisabled = loading || (HISTORICAL_KEYS.includes(report.key) && trendLoading);
                        return (
                        <button key={fmt} onClick={() => handleExport(report, fmt)} disabled={isDisabled} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", border: "1px solid #e2e8f0", borderRadius: 5, background: isDisabled ? "#f8fafc" : "white", color: isDisabled ? "#cbd5e1" : "#475569", fontSize: 11, fontWeight: 600, cursor: isDisabled ? "default" : "pointer" }}>
                          <Download size={11} /> {fmt}
                        </button>
                        );
                      }) : (
                        <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>Export requires Payroll Manager or Admin access</span>
                      )}
                      <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", border: "1px solid #dbeafe", borderRadius: 5, background: "#dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        <Calendar size={11} /> Schedule
                      </button>
                      <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>Last: {today}</span>
                    </div>
                    {emptyNotice === report.key && (
                      <div style={{ marginTop: 6, fontSize: 10, color: "#a16207", background: "#fef9c3", border: "1px solid #fde047", borderRadius: 4, padding: "4px 8px" }}>
                        No matching records for this period — nothing to export.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </AppLayout>
  );
}
