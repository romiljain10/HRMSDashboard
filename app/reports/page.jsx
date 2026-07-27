"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { Download, FileText, Calendar, BarChart2, Users, DollarSign, Clock, Grid3X3, CalendarClock, ArrowRight } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    category: "Payroll Reports",
    items: [
      { name: "Weekly Payroll Detail",       desc: "Full employee payroll breakdown with hours, rates, burden, and totals by department", icon: DollarSign, color: "#2563eb", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/payroll" },
      { name: "Payroll Hours Report — Pay Schedule", desc: "Regular, overtime, and holiday hours for every weekly pay period, plus current-period detail", icon: CalendarClock, color: "#0891b2", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/reports/payroll-hours" },
      { name: "Department Payroll Rollup",   desc: "Summarized payroll costs by department with variance vs budget",                      icon: BarChart2,  color: "#7c3aed", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/departments" },
      { name: "Labor Burden Report — Reg/OT/Holiday", desc: "Regular, OT, and holiday burden cost broken out by department",              icon: DollarSign, color: "#059669", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/payroll#burden-breakdown" },
      { name: "Payroll History Summary",     desc: "Month-over-month payroll trends, total cost, and headcount changes",                  icon: FileText,   color: "#0891b2", formats: ["XLSX","PDF"], lastRun: "Apr 30, 2026" },
      { name: "Overtime Exception Report",   desc: "All employees with OT hours, rates, and cost impact for the period",                  icon: Clock,      color: "#dc2626", formats: ["XLSX","PDF"], lastRun: "May 3, 2026" },
      { name: "Salary Distribution Report",  desc: "Pay rate distribution, burden breakdown, and fully-loaded cost analysis",             icon: DollarSign, color: "#059669", formats: ["XLSX","PDF"], lastRun: "May 3, 2026" },
    ],
  },
  {
    category: "Employee Reports",
    items: [
      { name: "Employee Directory Export",   desc: "Complete employee list with department, title, status, and pay rate information",     icon: Users,      color: "#2563eb", formats: ["XLSX","CSV"],  lastRun: "May 3, 2026", href: "/employees" },
      { name: "Employee Status Report",      desc: "Active vs inactive headcount, department assignments, and employment type breakdown",  icon: Users,      color: "#7c3aed", formats: ["XLSX","PDF"], lastRun: "May 3, 2026" },
      { name: "Payroll Approval Status",     desc: "Pending, approved, and flagged payroll records for the current period",               icon: FileText,   color: "#d97706", formats: ["XLSX","PDF"], lastRun: "May 3, 2026" },
    ],
  },
  {
    category: "Department Reports",
    items: [
      { name: "Department Headcount Report", desc: "Employee count, hours worked, and payroll cost per department",                        icon: Grid3X3,    color: "#059669", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/departments" },
      { name: "Department Cost Analysis",    desc: "Cost per employee, cost per hour, and OT percentage by department",                    icon: BarChart2,  color: "#2563eb", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/departments" },
    ],
  },
  {
    category: "Attendance Reports",
    items: [
      { name: "Hours Worked Summary",        desc: "Regular, overtime, and holiday hours by employee and department",                      icon: Clock,      color: "#0891b2", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/reports/payroll-hours" },
      { name: "Paid Time Off (PTO) Report",  desc: "PTO accrued, used, and remaining balance by employee, with low-balance flags",         icon: CalendarClock, color: "#7c3aed", formats: ["XLSX","PDF"], lastRun: "May 3, 2026", href: "/reports/pto" },
      { name: "Missing Hours Report",        desc: "Employees with zero hours logged during the current payroll period",                   icon: Clock,      color: "#dc2626", formats: ["XLSX","PDF"], lastRun: "May 3, 2026" },
    ],
  },
];

export default function ReportsPage() {
  return (
    <AppLayout>
      <Header title="Reports" subtitle="Payroll, Employee & Department Reports" />
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
                      {report.formats.map(fmt => (
                        <button key={fmt} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", border: "1px solid #e2e8f0", borderRadius: 5, background: "white", color: "#475569", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                          <Download size={11} /> {fmt}
                        </button>
                      ))}
                      <button style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", border: "1px solid #dbeafe", borderRadius: 5, background: "#dbeafe", color: "#1d4ed8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        <Calendar size={11} /> Schedule
                      </button>
                      <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>Last: {report.lastRun}</span>
                    </div>
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
