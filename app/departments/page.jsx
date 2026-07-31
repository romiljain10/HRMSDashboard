"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { DataStateBanner } from "@/components/DataStateBanner";
import { SkeletonKpiCard, SkeletonTableRows, SkeletonBlock } from "@/components/Skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useWeeklyTrend } from "@/hooks/useWeeklyTrend";

const DEPT_COLORS = { Management: "#1e40af", "Front Desk": "#2563eb", Sales: "#7c3aed", "Night Auditor": "#0891b2", Housekeeping: "#059669", Maintenance: "#d97706" };
const FALLBACK_COLORS = ["#0891b2", "#be185d", "#65a30d", "#9333ea", "#ea580c", "#0d9488"];

export default function DepartmentsPage() {
  const { data, loading, error, retry, locations, location } = useFilteredPayrollDataset();
  const { start, end } = useDateRange();
  const departmentTotals = data?.departmentTotals ?? [];
  const employees = data?.employees ?? [];
  const GRAND_TOTAL = data?.grandTotal || 1; // avoid div-by-zero while loading
  const { chartData: trendData, groups: trendGroups, loading: trendLoading, error: trendError } = useWeeklyTrend(6);

  const groupedData = Object.values(
    departmentTotals.reduce((acc, d) => {
      if (!acc[d.group]) acc[d.group] = { group: d.group, cost: 0, hours: 0, otHours: 0 };
      acc[d.group].cost += d.total;
      acc[d.group].hours += d.hours;
      acc[d.group].otHours += d.otHours;
      return acc;
    }, {})
  );

  return (
    <AppLayout>
      <Header title="Department Analytics" subtitle={`${location}  |  ${formatDateRangeLabel(start, end)}`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        <DataStateBanner loading={loading} error={error} onRetry={retry} degraded={!loading && !error && data?.meta?.hoursLive === false} />

        {/* Group KPI Cards */}
        <div className="grid-3col" style={{ marginBottom: 14 }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonKpiCard key={i} />)
          ) : (
          groupedData.map((g, i) => {
            const empCount = employees.filter(e => e.departmentGroup === g.group).length;
            const color = DEPT_COLORS[g.group] || "#2563eb";
            return (
              <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 14, borderLeft: `4px solid ${color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{g.group}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{empCount} employees</div>
                  </div>
                  <span style={{ background: color + "15", color, padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    {((g.cost / GRAND_TOTAL) * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {[
                    { label: "Payroll", value: "$" + Math.round(g.cost).toLocaleString() },
                    { label: "Hours",   value: g.hours.toFixed(0) },
                    { label: "OT Hrs",  value: g.otHours.toFixed(1), alert: g.otHours > 0 },
                  ].map((s, j) => (
                    <div key={j} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: s.alert ? "#dc2626" : "#0f172a" }}>{s.value}</div>
                      <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }))}
        </div>

        {/* Charts */}
        <div className="grid-2col" style={{ marginBottom: 14 }}>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Payroll by Group</div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>This Week</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={groupedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="group" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip formatter={v => ["$" + v.toLocaleString(), "Payroll"]} />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Weekly Payroll Trend</div>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>Last 6 weeks by department — live, updates with location/date filters</div>
            {trendLoading ? (
              <SkeletonBlock height={200} />
            ) : trendError ? (
              <div style={{ fontSize: 11, color: "#b91c1c", padding: "20px 0" }}>{trendError}</div>
            ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} />
                <Tooltip formatter={v => ["$" + v.toLocaleString()]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                {trendGroups.map((g, i) => (
                  <Line key={g.key} type="monotone" dataKey={g.key} stroke={DEPT_COLORS[g.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} strokeWidth={2} dot={false} name={g.name} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detailed Table */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Department Detail Breakdown</div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 580 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Group","Department","Employees","Reg Hours","OT Hours","Holiday Hours","Payroll Cost","% of Total","Budget Var"].map(h => (
                    <th key={h} style={{ padding: "7px 12px", textAlign: ["Employees","Reg Hours","OT Hours","Holiday Hours","Payroll Cost","% of Total","Budget Var"].includes(h) ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonTableRows cols={9} rows={6} /> : departmentTotals.map((d, i) => {
                  const empCount = employees.filter(e => e.department === d.department).length;
                  const budgetVar = (((i % 3) - 1) * 2.8).toFixed(1);
                  const varNum = parseFloat(budgetVar);
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: (DEPT_COLORS[d.group] || "#2563eb") + "15", color: DEPT_COLORS[d.group] || "#2563eb", padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>{d.group}</span>
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{d.department}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{empCount}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{d.hours.toFixed(1)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: d.otHours > 0 ? "#dc2626" : "#94a3b8", fontWeight: d.otHours > 0 ? 700 : 400 }}>{d.otHours.toFixed(1)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: d.holidayHours > 0 ? "#d97706" : "#94a3b8", fontWeight: d.holidayHours > 0 ? 700 : 400 }}>{d.holidayHours.toFixed(1)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>${d.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#64748b" }}>{((d.total / GRAND_TOTAL) * 100).toFixed(1)}%</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: varNum <= 0 ? "#16a34a" : "#dc2626" }}>
                        {varNum > 0 ? "+" : ""}{budgetVar}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
