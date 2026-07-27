"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { usePayrollDataset } from "@/hooks/usePayrollDataset";
import { DataStateBanner } from "@/components/DataStateBanner";
// payPeriods is a 13-week historical trend — BambooHR has no payroll-history
// endpoint we're using here, so it stays static except the live employee
// breakdown below it.
import { payPeriods, PROPERTY, WEEK } from "@/data/employees";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PayrollHoursReportPage() {
  const { data, loading, error, retry } = usePayrollDataset();
  const employees = data?.employees ?? [];
  const current = payPeriods[payPeriods.length - 1];
  const totals = payPeriods.reduce((acc, p) => ({
    regularHours: acc.regularHours + p.regularHours,
    otHours: acc.otHours + p.otHours,
    holidayHours: acc.holidayHours + p.holidayHours,
    totalCost: acc.totalCost + p.totalCost,
  }), { regularHours: 0, otHours: 0, holidayHours: 0, totalCost: 0 });

  return (
    <AppLayout>
      <Header title="Payroll Hours Report" subtitle={`${PROPERTY.name}  |  by Pay Schedule (${PROPERTY.paySchedule})`} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>
        <Link href="/reports" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2563eb", fontSize: 12, textDecoration: "none", marginBottom: 14 }}>
          <ArrowLeft size={13} /> Back to Reports
        </Link>

        {/* Summary cards */}
        <div className="grid-kpi-4" style={{ marginBottom: 14 }}>
          {[
            { label: "Current Period Reg Hrs", value: current.regularHours.toFixed(1), color: "#2563eb" },
            { label: "Current Period OT Hrs",   value: current.otHours.toFixed(1),      color: current.otHours > 0 ? "#dc2626" : "#059669" },
            { label: "Current Period Holiday",  value: current.holidayHours.toFixed(1), color: current.holidayHours > 0 ? "#d97706" : "#94a3b8" },
            { label: "13-Period Total Hours",   value: (totals.regularHours + totals.otHours + totals.holidayHours).toLocaleString("en-US", { maximumFractionDigits: 0 }), color: "#7c3aed" },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Hours by Pay Period</div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>Regular / OT / Holiday hours across each {PROPERTY.paySchedule.split(" ")[0].toLowerCase()} pay period</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={payPeriods} margin={{ left: 4, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v, n) => [v.toFixed(2) + " hrs", n]} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="regularHours" stackId="h" fill="#2563eb" name="Regular" />
              <Bar dataKey="otHours" stackId="h" fill="#dc2626" name="OT" />
              <Bar dataKey="holidayHours" stackId="h" fill="#d97706" name="Holiday" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pay Schedule table */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Hours by Pay Period</div>
            <button style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#2563eb", color: "white", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Download size={12} /> Export
            </button>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Pay Period", "Schedule", "Regular Hrs", "OT Hrs", "Holiday Hrs", "Total Hrs", "Total Cost"].map(h => (
                    <th key={h} style={{ textAlign: ["Regular Hrs","OT Hrs","Holiday Hrs","Total Hrs","Total Cost"].includes(h) ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payPeriods.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: p.label === WEEK.label ? "#eff6ff" : "transparent" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#0f172a", fontWeight: p.label === WEEK.label ? 700 : 500 }}>
                      {p.label} {p.label === WEEK.label && <span style={{ marginLeft: 6, background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: 999, fontSize: 9, fontWeight: 700 }}>Current</span>}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>{p.schedule}</span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{p.regularHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: p.otHours > 0 ? "#dc2626" : "#94a3b8", fontWeight: p.otHours > 0 ? 700 : 400 }}>{p.otHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: p.holidayHours > 0 ? "#d97706" : "#94a3b8", fontWeight: p.holidayHours > 0 ? 700 : 400 }}>{p.holidayHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700 }}>{p.totalHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>${p.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: "9px 12px", fontSize: 12 }}>13-Period Total</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12 }}>{totals.regularHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12, color: "#dc2626" }}>{totals.otHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12, color: "#d97706" }}>{totals.holidayHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 12 }}>{(totals.regularHours + totals.otHours + totals.holidayHours).toFixed(1)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontSize: 13, color: "#1e40af" }}>${totals.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Current period, by employee */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Current Pay Period Detail — {WEEK.label}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Regular, OT and Holiday hours by employee for this {PROPERTY.paySchedule.split(" ")[0].toLowerCase()} pay period — live from BambooHR</div>
          </div>
          <div style={{ padding: "10px 14px 0" }}>
            <DataStateBanner loading={loading} error={error} onRetry={retry} degraded={!loading && !error && data?.meta?.hoursLive === false} />
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Dept", "Regular Hrs", "OT Hrs", "Holiday Hrs", "Total Hrs"].map(h => (
                    <th key={h} style={{ textAlign: ["Regular Hrs","OT Hrs","Holiday Hrs","Total Hrs"].includes(h) ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => e.regularHours + e.otHours + e.holidayHours > 0).map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{e.name}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>{e.departmentGroup}</span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{e.regularHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: e.otHours > 0 ? "#dc2626" : "#94a3b8", fontWeight: e.otHours > 0 ? 700 : 400 }}>{e.otHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: e.holidayHours > 0 ? "#d97706" : "#94a3b8", fontWeight: e.holidayHours > 0 ? 700 : 400 }}>{e.holidayHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700 }}>{(e.regularHours + e.otHours + e.holidayHours).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
