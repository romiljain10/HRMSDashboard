"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { DataStateBanner } from "@/components/DataStateBanner";
import { SkeletonKpiCard, SkeletonTableRows } from "@/components/Skeleton";
import { WEEK, PROPERTY } from "@/data/employees";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { useState } from "react";
import { Search, Download, CheckCircle, Clock, AlertCircle, Clock3, CalendarDays } from "lucide-react";
import Link from "next/link";
import { buildDepartmentTotals, buildBurdenByDepartment, buildCurrentPeriodTotals } from "@/lib/payroll/aggregates";
import { round2 } from "@/lib/payroll/config";
import { exportCSV, exportXLSX } from "@/lib/reports/exportFile";
import { buildReportRows } from "@/lib/reports/buildRows";

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
  const allEmployees = data?.employees ?? [];
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  // Default to "Approved" so the page opens showing only approved payroll —
  // switch to "Pending" or "All" to review what's still outstanding.
  const [approvalFilter, setApprovalFilter] = useState("Approved");
  const [exportOpen, setExportOpen] = useState(false);
  const [deptExportOpen, setDeptExportOpen] = useState(false);

  const employees = approvalFilter === "All" ? allEmployees : allEmployees.filter(e => e.approvalStatus === approvalFilter);

  // Department Rollups, Burden Breakdown, and the KPI cards below all
  // recompute from the approval-filtered set, so "Approved" really means
  // every number on the page reflects only approved hours/cost.
  const departmentTotals = buildDepartmentTotals(employees);
  const burdenByDepartment = buildBurdenByDepartment(employees);
  const currentPeriodTotalsComputed = buildCurrentPeriodTotals(employees);
  const CURRENT_PERIOD_TOTALS = currentPeriodTotalsComputed;
  const GRAND_TOTAL = round2(employees.reduce((s, e) => s + e.totalCost + (e.ptoCost || 0), 0));

  const depts = ["All", ...new Set(employees.map(e => e.departmentGroup))];
  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.title.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.departmentGroup === deptFilter;
    return matchSearch && matchDept;
  });

  const totalPayroll = filtered.reduce((s, e) => s + e.totalCost + (e.ptoCost || 0), 0);
  const totalHours   = filtered.reduce((s, e) => s + e.regularHours + e.otHours + e.holidayHours, 0);
  const totalOT      = filtered.reduce((s, e) => s + e.otHours, 0);
  const totalHoliday = filtered.reduce((s, e) => s + e.holidayHours, 0);
  const pending      = allEmployees.filter(e => e.approvalStatus === "Pending").length;

  const [exportStatus, setExportStatus] = useState(null);

  function handleExport(reportKey, format) {
    setExportStatus("exporting");
    setTimeout(() => {
      const { columns, rows } = buildReportRows(reportKey, { ...data, employees: filtered, departmentTotals, burdenByDepartment });
      if (format === "CSV") exportCSV(reportKey, columns, rows);
      else exportXLSX(reportKey, columns, rows);
      setExportStatus("exported");
      setTimeout(() => setExportStatus(null), 2000);
    }, 300);
  }

  return (
    <AppLayout>
      <Header title="Payroll Center" subtitle={`${location}  |  ${formatDateRangeLabel(start, end)}  |  ${PROPERTY.paySchedule}`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        <DataStateBanner loading={loading} error={error} onRetry={retry} degraded={!loading && !error && data?.meta?.hoursLive === false} />
        <DataStateBanner loading={false} error={null} degraded={!loading && !error && data?.meta?.compensationAccessible === false} degradedMessage="Pay rates are showing $0 for everyone — this usually means the BambooHR API key's user doesn't have 'Compensation' view permission. Ask an Admin to grant that access, or generate the key from an account that has it." />

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
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonKpiCard key={i} />)
          ) : (
          [
            { label: "Total Payroll (incl. PTO)", value: "$" + totalPayroll.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: "#2563eb" },
            { label: "Total Hours",        value: totalHours.toFixed(1), color: "#7c3aed" },
            { label: "OT Hours",           value: totalOT.toFixed(1), color: totalOT > 0 ? "#dc2626" : "#059669" },
            { label: "Holiday Hours",      value: totalHoliday.toFixed(1), color: totalHoliday > 0 ? "#d97706" : "#94a3b8" },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          )))}
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
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Department Rollups</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {exportStatus === "exporting" && <span style={{ fontSize: 10, color: "#94a3b8" }}>Exporting...</span>}
              {exportStatus === "exported" && <span style={{ fontSize: 10, color: "#16a34a" }}>Exported ✓</span>}
            <div style={{ position: "relative" }}>
              <button onClick={() => setDeptExportOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 5, background: "white", color: "#2563eb", border: "1px solid #dbeafe", borderRadius: 6, padding: "4px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                <Download size={11} /> Export
              </button>
              {deptExportOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 50, overflow: "hidden" }}>
                  {["CSV", "XLSX"].map(fmt => (
                    <button key={fmt} onClick={() => { handleExport("department-payroll-rollup", fmt); setDeptExportOpen(false); }}
                      style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: "white", fontSize: 12, color: "#0f172a", cursor: "pointer", textAlign: "left" }}>
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
          </div>
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
                {loading ? <SkeletonTableRows cols={7} rows={6} /> : departmentTotals.map((d, i) => (
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
            <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)}
              style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }}>
              {["Approved", "Pending", "All"].map(a => <option key={a}>{a}</option>)}
            </select>
            <div style={{ position: "relative" }}>
              <button onClick={() => setExportOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 5, background: "#2563eb", color: "white", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Download size={12} /> Export
              </button>
              {exportOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 6, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 50, overflow: "hidden" }}>
                  {["CSV", "XLSX"].map(fmt => (
                    <button key={fmt} onClick={() => { handleExport("weekly-payroll-detail", fmt); setExportOpen(false); }}
                      style={{ display: "block", width: "100%", padding: "7px 14px", border: "none", background: "white", fontSize: 12, color: "#0f172a", cursor: "pointer", textAlign: "left" }}>
                      {fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee","Title","Dept","Reg Hrs","OT Hrs","Holiday Hrs","Base Rate","Payroll Cost, Tax, Benefits, and Workers Comp","RT Rate","OT Rate","Total Cost","Approval"].map(h => (
                    <th key={h} style={{ textAlign: ["Reg Hrs","OT Hrs","Holiday Hrs","Base Rate","Payroll Cost, Tax, Benefits, and Workers Comp","RT Rate","OT Rate","Total Cost"].includes(h) ? "right" : "left", padding: "7px 10px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: h === "Payroll Cost, Tax, Benefits, and Workers Comp" ? "normal" : "nowrap", maxWidth: h === "Payroll Cost, Tax, Benefits, and Workers Comp" ? 90 : undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTableRows cols={12} rows={8} /> : filtered.map((e) => (
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
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Payroll Cost, Tax, Benefits, and Workers Comp Breakdown — Regular / OT / Holiday</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Employer-paid Payroll Cost, Tax, Benefits, and Workers Comp (@ {((employees[0]?.burden ?? 0) * 100).toFixed(1)}%) split by pay type, per department</div>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Department", "Group", "Regular PCTB&WC", "OT PCTB&WC", "Holiday PCTB&WC", "Total PCTB&WC"].map(h => (
                    <th key={h} style={{ textAlign: ["Regular PCTB&WC","OT PCTB&WC","Holiday PCTB&WC","Total PCTB&WC"].includes(h) ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTableRows cols={6} rows={6} /> : burdenByDepartment.map((d, i) => (
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

        {/* PTO Detail — full detail lives on Reports → PTO; this is a quick-reference summary */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", marginTop: 14, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>PTO Detail</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Accrued / used / remaining balance, live from BambooHR</div>
            </div>
            <Link href="/reports/pto" style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Full PTO Report →</Link>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Dept", "PTO Accrued", "PTO Used", "PTO Balance"].map(h => (
                    <th key={h} style={{ textAlign: ["PTO Accrued", "PTO Used", "PTO Balance"].includes(h) ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTableRows cols={5} rows={6} /> : filtered.slice(0, 15).map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{e.name}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>{e.department}</span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{e.ptoAccrued.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{e.ptoUsed.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: e.ptoBalance < 8 ? "#dc2626" : "#0f172a" }}>{e.ptoBalance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 15 && (
            <div style={{ padding: "8px 14px", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
              Showing 15 of {filtered.length} — see the full PTO Report for everyone.
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
