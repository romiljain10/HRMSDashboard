"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import KpiCard from "@/components/KpiCard";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { DataStateBanner } from "@/components/DataStateBanner";
import { SkeletonKpiCard } from "@/components/Skeleton";
// Hotel revenue-management figures (RevPAR, ADR, Occupancy, GOP) and the
// historical trend line have no BambooHR equivalent — a PMS/revenue system
// would feed these, so they stay on the static dataset. PROPERTY is the
// hotel's own profile info, also not BambooHR data.
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";
import { DollarSign, Users, Grid3X3, AlertTriangle, CheckCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

const DEPT_COLORS = ["#1e40af","#2563eb","#7c3aed","#0891b2","#059669","#d97706"];

export default function Dashboard() {
  const { data, loading, error, retry, locations, location } = useFilteredPayrollDataset();
  const { start, end } = useDateRange();
  const employees = data?.employees ?? [];
  const departmentTotals = data?.departmentTotals ?? [];
  const GRAND_TOTAL = data?.grandTotal || 0;
  const CURRENT_PERIOD_TOTALS = data?.currentPeriodTotals ?? { regularHours: 0, otHours: 0, holidayHours: 0, totalHours: 0, totalCost: 0 };

  const deptPayrollData = departmentTotals
    .filter(d => d.total > 0)
    .map(d => ({ name: d.group, cost: Math.round(d.total) }))
    .reduce((acc, d) => {
      const ex = acc.find(x => x.name === d.name);
      if (ex) ex.cost += d.cost;
      else acc.push({ ...d });
      return acc;
    }, []);

  const deptEmpData = Object.entries(
    employees.reduce((acc, e) => {
      acc[e.departmentGroup] = (acc[e.departmentGroup] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const recentEmployees = [...employees]
    .filter(e => e.status === "Active")
    .slice(0, 5);

  const recentPayroll = [...employees]
    .filter(e => e.totalCost > 0)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 6);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === "Active").length;
  const departments = new Set(employees.map(e => e.departmentGroup)).size;
  const monthlyPayroll = GRAND_TOTAL * 4; // approx monthly from weekly
  const pendingPayroll = employees.filter(e => e.approvalStatus === "Pending").length;
  const approvedPayroll = employees.filter(e => e.approvalStatus === "Approved").length;

  return (
    <AppLayout>
      <Header title="HR Dashboard" subtitle={`${location}  |  ${formatDateRangeLabel(start, end)}`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        <DataStateBanner loading={loading} error={error} onRetry={retry} degraded={!loading && !error && data?.meta?.hoursLive === false} />
        <DataStateBanner loading={false} error={null} degraded={!loading && !error && data?.meta?.compensationAccessible === false} degradedMessage="Pay rates are showing $0 for everyone — this usually means the BambooHR API key's user doesn't have 'Compensation' view permission. Ask an Admin to grant that access, or generate the key from an account that has it." />

        {/* KPI Cards */}
        <div className="grid-kpi-4" style={{ marginBottom: 14 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonKpiCard key={i} />)
          ) : (
          [
            { label: "Total Employees",   value: totalEmployees,                                    color: "#2563eb", icon: Users,      sub: `${activeEmployees} active` },
            { label: "Departments",       value: departments,                                        color: "#7c3aed", icon: Grid3X3,    sub: "Active departments" },
            { label: "Monthly Payroll",   value: "$" + (monthlyPayroll / 1000).toFixed(0) + "K",   color: "#059669", icon: DollarSign, sub: "Estimated this month" },
          ].map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ background: s.color + "15", borderRadius: 8, padding: 9, flexShrink: 0 }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>{s.sub}</div>
              </div>
            </div>
          )))}
        </div>

        {/* Payroll Status Row */}
        <div className="grid-kpi-4" style={{ marginBottom: 14 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonKpiCard key={i} />)
          ) : (
          [
            { label: "Weekly Payroll (incl. PTO)", value: "$" + GRAND_TOTAL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: "#1e40af" },
            { label: "Total Hours",         value: CURRENT_PERIOD_TOTALS.totalHours.toFixed(1) + " hrs", color: "#7c3aed" },
            { label: "Approved",            value: approvedPayroll,  color: "#059669" },
            { label: "OT Hours",            value: CURRENT_PERIOD_TOTALS.otHours.toFixed(1) + " hrs", color: "#dc2626" },
          ].map((c, i) => (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          )))}
        </div>

        {/* Charts Row */}
        <div className="grid-chart-2" style={{ marginBottom: 14 }}>
          {/* Payroll by Department bar chart */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Payroll Cost by Department</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>This week — grouped by department</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptPayrollData} layout="vertical" margin={{ left: 6, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => "$" + (v / 1000).toFixed(1) + "k"} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={80} />
                <Tooltip formatter={v => ["$" + v.toLocaleString(), "Payroll"]} />
                <Bar dataKey="cost" fill="#2563eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Employee Count by Department pie */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Department Distribution</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>Employee headcount by department</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={deptEmpData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={2}>
                  {deptEmpData.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v + " employees", n]} />
                <Legend iconSize={9} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid-2col" style={{ marginBottom: 14 }}>
          {/* Recent Employees */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Employee Status Overview</div>
              <Link href="/employees" style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}>View all →</Link>
            </div>
            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 340 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Department", "Status", "Payroll"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentEmployees.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "#0f172a" }}>{e.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.title}</div>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ background: "#f1f5f9", color: "#64748b", padding: "1px 6px", borderRadius: 3, fontSize: 10 }}>{e.departmentGroup}</span>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: e.status === "Active" ? "#dcfce7" : "#f1f5f9", color: e.status === "Active" ? "#16a34a" : "#64748b", padding: "2px 6px", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>
                          {e.status === "Active" ? <CheckCircle size={9} /> : <Clock size={9} />}
                          {e.status}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: e.totalCost > 0 ? "#0f172a" : "#94a3b8" }}>
                        {e.totalCost > 0 ? "$" + e.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payroll Activity */}
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Recent Payroll Activity</div>
              <Link href="/payroll" style={{ fontSize: 11, color: "#2563eb", textDecoration: "none" }}>View all →</Link>
            </div>
            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 340 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Hours", "Total", "Status"].map(h => (
                      <th key={h} style={{ textAlign: h === "Hours" || h === "Total" ? "right" : "left", padding: "7px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPayroll.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "8px 12px" }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "#0f172a" }}>{e.name}</div>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.departmentGroup}</div>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#475569" }}>
                        {(e.regularHours + e.otHours).toFixed(1)}
                        {e.otHours > 0 && <span style={{ color: "#dc2626", fontSize: 10, marginLeft: 3 }}>+{e.otHours}OT</span>}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                        ${e.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          background: e.approvalStatus === "Approved" ? "#dcfce7" : e.approvalStatus === "Pending" ? "#fef9c3" : "#fee2e2",
                          color: e.approvalStatus === "Approved" ? "#16a34a" : e.approvalStatus === "Pending" ? "#a16207" : "#dc2626",
                          padding: "2px 6px", borderRadius: 999, fontSize: 10, fontWeight: 600
                        }}>
                          {e.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Department Payroll Summary */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Department Payroll Summary</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>La Bella Vista Hotel  |  This Week</div>
            </div>
            <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Weekly</span>
          </div>
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 440 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Department", "Group", "Hrs", "OT Hrs", "Holiday Hrs", "Total Payroll", "% Share"].map(h => (
                    <th key={h} style={{ textAlign: ["Hrs","OT Hrs","Holiday Hrs","Total Payroll","% Share"].includes(h) ? "right" : "left", padding: "7px 14px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departmentTotals.filter(d => d.total > 0).map((d, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                    <td style={{ padding: "8px 14px", fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{d.department}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>{d.group}</span>
                    </td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontSize: 12 }}>{d.hours.toFixed(0)}</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontSize: 12, color: d.otHours > 0 ? "#dc2626" : "#94a3b8", fontWeight: d.otHours > 0 ? 700 : 400 }}>{d.otHours.toFixed(1)}</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontSize: 12, color: d.holidayHours > 0 ? "#d97706" : "#94a3b8", fontWeight: d.holidayHours > 0 ? 700 : 400 }}>{d.holidayHours.toFixed(1)}</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontSize: 12, fontWeight: 600 }}>${d.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: "8px 14px", textAlign: "right", fontSize: 12, color: "#64748b" }}>{((d.total / GRAND_TOTAL) * 100).toFixed(1)}%</td>
                  </tr>
                ))}
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td colSpan={2} style={{ padding: "9px 14px", fontSize: 12, color: "#0f172a" }}>Grand Total</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12 }}>{CURRENT_PERIOD_TOTALS.regularHours.toFixed(0)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, color: "#dc2626" }}>{CURRENT_PERIOD_TOTALS.otHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12, color: "#d97706" }}>{CURRENT_PERIOD_TOTALS.holidayHours.toFixed(1)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 13, color: "#1e40af" }}>${GRAND_TOTAL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontSize: 12 }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </AppLayout>
  );
}
