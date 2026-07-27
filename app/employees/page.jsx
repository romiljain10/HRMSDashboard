"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { DataStateBanner } from "@/components/DataStateBanner";
import { useState } from "react";
import { Search, ChevronUp, ChevronDown, Eye } from "lucide-react";
import Link from "next/link";

export default function EmployeesPage() {
  const { data, loading, error, retry, locations, location } = useFilteredPayrollDataset();
  const employees = data?.employees ?? [];
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const depts = ["All", ...new Set(employees.map(e => e.departmentGroup))];

  const filtered = employees
    .filter(e => {
      const s = search.toLowerCase();
      return (e.name.toLowerCase().includes(s) || e.title.toLowerCase().includes(s) || e.employeeNumber.toLowerCase().includes(s) || (e.location || "").toLowerCase().includes(s))
        && (deptFilter === "All" || e.departmentGroup === deptFilter)
        && (statusFilter === "All" || e.status === statusFilter);
    })
    .sort((a, b) => {
      const va = a[sortField], vb = b[sortField];
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronDown size={11} color="#cbd5e1" />;
    return sortDir === "asc" ? <ChevronUp size={11} color="#2563eb" /> : <ChevronDown size={11} color="#2563eb" />;
  }

  return (
    <AppLayout>
      <Header title="Employee Directory" subtitle={`${location}  |  Apr 27 – May 3, 2026`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        <DataStateBanner loading={loading} error={error} onRetry={retry} degraded={!loading && !error && data?.meta?.hoursLive === false} />

        {/* Stats */}
        <div className="grid-kpi-4" style={{ marginBottom: 14 }}>
          {[
            { label: "Total Employees",      value: employees.length,                                                color: "#2563eb" },
            { label: "Active",               value: employees.filter(e => e.status === "Active").length,            color: "#16a34a" },
            { label: "Worked This Week",     value: employees.filter(e => e.regularHours + e.otHours > 0).length,  color: "#7c3aed" },
            { label: "Pending Approval",     value: employees.filter(e => e.approvalStatus === "Pending").length,  color: "#d97706" },
          ].map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {/* Filters */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
              <Search size={12} style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, title, #..."
                style={{ width: "100%", paddingLeft: 24, paddingRight: 8, paddingTop: 6, paddingBottom: 6, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none" }} />
            </div>
            <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
              style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", flex: "0 0 auto" }}>
              {depts.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", flex: "0 0 auto" }}>
              {["All","Active","Inactive"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {!loading && !error && employees.length === 0 ? (
            <div style={{ padding: "32px 14px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
              No employees found in BambooHR yet.
            </div>
          ) : (
          <div className="table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {[
                    { key: "employeeNumber", label: "Emp #" },
                    { key: "name",           label: "Name" },
                    { key: "title",          label: "Title" },
                    { key: "departmentGroup",label: "Dept" },
                    { key: "location",       label: "Location" },
                    { key: "status",         label: "Status" },
                    { key: "regularHours",   label: "Reg Hrs", right: true },
                    { key: "otHours",        label: "OT Hrs",  right: true },
                    { key: "totalCost",      label: "Weekly Cost", right: true },
                    { key: "approvalStatus", label: "Approval" },
                  ].map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)} style={{ padding: "8px 12px", textAlign: col.right ? "right" : "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        {col.label} <SortIcon field={col.key} />
                      </span>
                    </th>
                  ))}
                  <th style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>View</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f8fafc", opacity: e.status === "Inactive" ? 0.6 : 1 }}>
                    <td style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{e.employeeNumber}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {e.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{e.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>{e.title}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: "#f1f5f9", color: "#475569", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{e.departmentGroup}</span>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>{e.location}</td>
                    <td style={{ padding: "8px 12px", fontSize: 11 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: e.status === "Active" ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.status === "Active" ? "#16a34a" : "#94a3b8", display: "inline-block" }} />
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12 }}>{e.regularHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: e.otHours > 0 ? "#dc2626" : "#94a3b8", fontWeight: e.otHours > 0 ? 700 : 400 }}>{e.otHours.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 700, color: e.totalCost > 0 ? "#0f172a" : "#94a3b8" }}>
                      {e.totalCost > 0 ? "$" + e.totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "—"}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ background: e.approvalStatus === "Approved" ? "#dcfce7" : "#fef9c3", color: e.approvalStatus === "Approved" ? "#16a34a" : "#a16207", padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>
                        {e.approvalStatus}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <Link href={`/employees/${e.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "#2563eb", fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                        <Eye size={12} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination */}
          <div style={{ padding: "8px 14px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#64748b", flexWrap: "wrap", gap: 6 }}>
            <span>{filtered.length} employees  |  Page {page} of {Math.max(totalPages,1)}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 5, background: "white", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 12 }}>← Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 5, background: "white", cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.4 : 1, fontSize: 12 }}>Next →</button>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
