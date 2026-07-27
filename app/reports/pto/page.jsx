"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { DataStateBanner } from "@/components/DataStateBanner";
import { PROPERTY, WEEK } from "@/data/employees";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { useState } from "react";
import { ArrowLeft, Download, Search, AlertTriangle } from "lucide-react";
import Link from "next/link";

const LOW_BALANCE_THRESHOLD = 8; // hrs

export default function PtoReportPage() {
  const { data, loading, error, retry, locations, location } = useFilteredPayrollDataset();
  const { start, end } = useDateRange();
  const employees = data?.employees ?? [];
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const depts = ["All", ...new Set(employees.map(e => e.departmentGroup))];
  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.departmentGroup === deptFilter;
    return matchSearch && matchDept;
  });

  const totalAccrued = filtered.reduce((s, e) => s + e.ptoAccrued, 0);
  const totalUsed = filtered.reduce((s, e) => s + e.ptoUsed, 0);
  const totalBalance = filtered.reduce((s, e) => s + e.ptoBalance, 0);
  const lowBalanceCount = filtered.filter(e => e.ptoBalance < LOW_BALANCE_THRESHOLD).length;

  return (
    <AppLayout>
      <Header title="Paid Time Off (PTO) Report" subtitle={`${location}  |  As of ${formatDateRangeLabel(start, end)}`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>
        <Link href="/reports" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontSize: 12, textDecoration: "none", marginBottom: 14 }}>
          <ArrowLeft size={13} /> Back to Reports
        </Link>

        <DataStateBanner loading={loading} error={error} onRetry={retry} degraded={!loading && !error && data?.meta?.ptoLive === false} degradedMessage="Live PTO balances from BambooHR are unavailable right now — showing 0 hrs until it reconnects." />

        {/* Summary cards */}
        <div className="grid-kpi-4" style={{ marginBottom: 14 }}>
          {[
            { label: "PTO Accrued (YTD)", value: totalAccrued.toFixed(1) + " hrs", color: "#2563eb" },
            { label: "PTO Used (YTD)",    value: totalUsed.toFixed(1) + " hrs",    color: "#7c3aed" },
            { label: "PTO Balance",       value: totalBalance.toFixed(1) + " hrs", color: "#059669" },
            { label: "Low Balance (<8h)", value: String(lowBalanceCount),          color: lowBalanceCount > 0 ? "#dc2626" : "#059669" },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", flex: 1, minWidth: 120 }}>Employee PTO Balances</div>
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
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Dept", "Status", "PTO Accrued", "PTO Used", "PTO Balance"].map(h => (
                    <th key={h} style={{ textAlign: ["PTO Accrued","PTO Used","PTO Balance"].includes(h) ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc", opacity: e.status === "Inactive" ? 0.6 : 1 }}>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#0f172a", whiteSpace: "nowrap" }}>{e.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.employeeNumber}</div>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>{e.departmentGroup}</span>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 11 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: e.status === "Active" ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.status === "Active" ? "#16a34a" : "#94a3b8", display: "inline-block" }} />
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{e.ptoAccrued.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#64748b" }}>{e.ptoUsed.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: e.ptoBalance < LOW_BALANCE_THRESHOLD ? "#dc2626" : "#0f172a" }}>
                        {e.ptoBalance < LOW_BALANCE_THRESHOLD && <AlertTriangle size={11} />}
                        {e.ptoBalance.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: "9px 12px", fontSize: 12 }}>Total</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12 }}>{totalAccrued.toFixed(2)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12 }}>{totalUsed.toFixed(2)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 13, color: "#1e40af" }}>{totalBalance.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#64748b" }}>
            {filtered.length} employees  |  PTO accrues at 3.08 hrs/pay period for hourly staff and 6.15 hrs/pay period for management
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
