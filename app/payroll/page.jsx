"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { DataStateBanner } from "@/components/DataStateBanner";
import { WEEK, PROPERTY } from "@/data/employees";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { useState } from "react";
import { Search, Download, CheckCircle, Clock, AlertCircle, Clock3, CalendarDays } from "lucide-react";
import Link from "next/link";

function StatusBadge({ status }) {
  const cfg = {
    Approved: { bg: "#dcfce7", color: "#16a34a", icon: CheckCircle },
    Pending:  { bg: "#fef9c3", color: "#a16207", icon: Clock },
    Flagged:  { bg: "#fee2e2", color: "#dc2626", icon: AlertCircle },
  }[status] || { bg: "#f1f5f9", color: "#64748b", icon: Clock };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: cfg.bg, color: cfg.color, padding: "2px 7px", borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      <cfg.icon size={10} />{status}
    </span>
  );
}

export default function PayrollPage() {
  const { data, loading, error, retry, locations, location } = useFilteredPayrollDataset();
  const { start, end } = useDateRange();
  const employees = data?.employees ?? [];
  const departmentTotals = data?.departmentTotals ?? [];
  const burdenByDepartment = data?.burdenByDepartment ?? [];
  const GRAND_TOTAL = data?.grandTotal || 0;
  const CURRENT_PERIOD_TOTALS = data?.currentPeriodTotals ?? { regularHours: 0, otHours: 0, holidayHours: 0 };
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const depts = ["All", ...new Set(employees.map(e => e.departmentGroup))];
  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.departmentGroup === deptFilter;
    return matchSearch && matchDept;
  });

  const totalPayroll = filtered.reduce((s, e) => s + e.totalCost, 0);
  const totalHours   = filtered.reduce((s, e) => s + e.regularHours + e.otHours + e.holidayHours, 0);
  const totalOT      = filtered.reduce((s, e) => s + e.otHours, 0);
  const totalHoliday = filtered.reduce((s, e) => s + e.holidayHours, 0);
  const pending      = filtered.filter(e => e.approvalStatus === "Pending").length;

  return (
    <AppLayout>
      <Header title="Payroll Center" subtitle={`${location}  |  ${formatDateRangeLabel(start, end)}  |  ${PROPERTY.paySchedule}`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        <DataStateBanner loading={loading} error={error} onRetry={retry} degraded={!loading && !error && data?.meta?.hoursLive === false} />

        {/* Quick report links */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <Link href="/reports/payroll-hours" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
            <CalendarDays size={13} /> Payroll Hours Report by Pay Schedule
          </Link>
          <Link href="/reports/pto" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#2563eb", textDecoration: "none" }}>
            <Clock3 size={13} /> Paid Time Off (PTO) Report
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid-kpi-4" style={{ marginBottom: 10 }}>
          {[
            { label: "Total Payroll",      value: "$" + totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: "#2563eb" },
            { label: "Total Hours",        value: totalHours.toFixed(1), color: "#7c3aed" },
            { label: "OT Hours",           value: totalOT.toFixed(1), color: totalOT > 0 ? "#dc2626" : "#059669" },
            { label: "Holiday Hours",      value: totalHoliday.toFixed(1), color: totalHoliday > 0 ? "#d97706" : "#94a3b8" },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pending Approvals</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>{pending}</div>
            <div style={{ marginLeft: "auto", fontSize: 11, color: "#94a3b8" }}>{filtered.length} of {employees.length} employees shown</div>
          </div>
        </div>

        {/* Department Rollups */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 14, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Department Rollups</div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Group", "Department", "Hours", "OT", "Holiday", "Payroll Cost", "% Total"].map(h => (
                    <th key={h} style={{ textAlign: ["Hours","OT","Holiday","Payroll Cost","% Total"].includes(h) ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departmentTotals.map((d, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 12px", fontSize: 11 }}>
                      <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{d.group}</span>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{d.department}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{d.hours.toFixed(1)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: d.otHours > 0 ? "#dc2626" : "#94a3b8", fontWeight: d.otHours > 0 ? 700 : 400 }}>{d.otHours.toFixed(1)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: d.holidayHours > 0 ? "#d97706" : "#94a3b8", fontWeight: d.holidayHours > 0 ? 700 : 400 }}>{d.holidayHours.toFixed(1)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>${d.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#64748b" }}>{((d.total / GRAND_TOTAL) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: "9px 12px", fontSize: 12 }}>Grand Total</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12 }}>{CURRENT_PERIOD_TOTALS.regularHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12, color: "#dc2626" }}>{CURRENT_PERIOD_TOTALS.otHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12, color: "#d97706" }}>{CURRENT_PERIOD_TOTALS.holidayHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 13, color: "#1e40af" }}>${GRAND_TOTAL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12 }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Detail Table */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", flex: 1, minWidth: 120 }}>Employee Payroll Detail</div>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ paddingLeft: 24, paddingRight: 8, paddingTop: 5, paddingBottom: 5, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", width: 140 }} />
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }}>
              {depts.map(d => <option key={d}>{d}</option>)}
            </select>
            <button style={{ display: "flex", alignItems: "center", gap: 5, background: "#2563eb", color: "white", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Download size={12} /> Export
            </button>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee","Title","Dept","Reg Hrs","OT Hrs","Holiday Hrs","Base Rate","Burden","RT Rate","OT Rate","Total Cost","Approval"].map(h => (
                    <th key={h} style={{ textAlign: ["Reg Hrs","OT Hrs","Holiday Hrs","Base Rate","Burden","RT Rate","OT Rate","Total Cost"].includes(h) ? "right" : "left", padding: "7px 10px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc", opacity: e.totalCost === 0 ? 0.6 : 1 }}>
                    <td style={{ padding: "8px 10px" }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#0f172a", whiteSpace: "nowrap" }}>{e.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.employeeNumber}</div>
                    </td>
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>{e.title}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "1px 5px", borderRadius: 3, fontSize: 10 }}>{e.departmentGroup}</span>
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12 }}>{e.regularHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, color: e.otHours > 0 ? "#dc2626" : "#94a3b8", fontWeight: e.otHours > 0 ? 700 : 400 }}>{e.otHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, color: e.holidayHours > 0 ? "#d97706" : "#94a3b8", fontWeight: e.holidayHours > 0 ? 700 : 400 }}>{e.holidayHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12 }}>${e.baseRate.toFixed(2)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12 }}>{(e.burden * 100).toFixed(1)}%</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, color: "#475569" }}>${e.fullyLoadedRT.toFixed(4)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, color: "#475569" }}>${e.fullyLoadedOT.toFixed(4)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: e.totalCost > 0 ? "#0f172a" : "#94a3b8" }}>
                      {e.totalCost > 0 ? "$" + e.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </td>
                    <td style={{ padding: "8px 10px" }}><StatusBadge status={e.approvalStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#64748b", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
            <span>{filtered.length} employees</span>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>Total: ${totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Regular / OT / Holiday Burden Breakdown by Department */}
        <div id="burden-breakdown" style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", marginTop: 14, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Labor Burden Breakdown — Regular / OT / Holiday</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Employer-paid burden cost (taxes, insurance, benefits @ {((employees[0]?.burden ?? 0) * 100).toFixed(1)}%) split by pay type, per department</div>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Department", "Group", "Regular Burden", "OT Burden", "Holiday Burden", "Total Burden"].map(h => (
                    <th key={h} style={{ textAlign: ["Regular Burden","OT Burden","Holiday Burden","Total Burden"].includes(h) ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {burdenByDepartment.map((d, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{d.department}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>{d.group}</span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>${d.regularBurden.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: d.otBurden > 0 ? "#dc2626" : "#94a3b8", fontWeight: d.otBurden > 0 ? 700 : 400 }}>${d.otBurden.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: d.holidayBurden > 0 ? "#d97706" : "#94a3b8", fontWeight: d.holidayBurden > 0 ? 700 : 400 }}>${d.holidayBurden.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#1e40af" }}>${d.totalBurden.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: "9px 12px", fontSize: 12 }}>Grand Total</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12 }}>${burdenByDepartment.reduce((s, d) => s + d.regularBurden, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12, color: "#dc2626" }}>${burdenByDepartment.reduce((s, d) => s + d.otBurden, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12, color: "#d97706" }}>${burdenByDepartment.reduce((s, d) => s + d.holidayBurden, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 13, color: "#1e40af" }}>${burdenByDepartment.reduce((s, d) => s + d.totalBurden, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
