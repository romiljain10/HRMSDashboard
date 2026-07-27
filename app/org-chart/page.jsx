"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { DataStateBanner } from "@/components/DataStateBanner";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function buildTree(employees) {
  const byName = new Map(employees.map((e) => [e.name, e]));
  const childrenOf = new Map();

  for (const e of employees) {
    const managerKey = e.manager && byName.has(e.manager) ? e.manager : "__root__";
    if (!childrenOf.has(managerKey)) childrenOf.set(managerKey, []);
    childrenOf.get(managerKey).push(e);
  }

  for (const list of childrenOf.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return { childrenOf, roots: childrenOf.get("__root__") || [] };
}

function OrgNode({ employee, childrenOf, depth }) {
  const reports = childrenOf.get(employee.name) || [];
  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 20, borderLeft: depth === 0 ? "none" : "1px dashed #e2e8f0", paddingLeft: depth === 0 ? 0 : 14, marginTop: 6 }}>
      <Link href={`/employees/${employee.id}`} style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, background: "white", border: "1px solid #e2e8f0", width: "fit-content" }}>
          <Avatar id={employee.id} name={employee.name} size={24} fontSize={9} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{employee.name}</div>
            <div style={{ fontSize: 10, color: "#64748b" }}>{employee.title} · {employee.department}</div>
          </div>
          {reports.length > 0 && (
            <span style={{ fontSize: 9, color: "#2563eb", fontWeight: 700, background: "#eff6ff", borderRadius: 999, padding: "1px 6px", marginLeft: 4 }}>
              {reports.length} report{reports.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </Link>
      {reports.map((child) => (
        <OrgNode key={child.id} employee={child} childrenOf={childrenOf} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgChartPage() {
  const { data, loading, error, retry, locations, location } = useFilteredPayrollDataset();
  const employees = data?.employees ?? [];
  const { childrenOf, roots } = buildTree(employees);

  return (
    <AppLayout>
      <Header title="Reporting Structure" subtitle={`${location}  |  Org Chart`} locations={locations} />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>
        <DataStateBanner loading={loading} error={error} onRetry={retry} />

        {!loading && !error && (
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 16 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
              Built live from BambooHR's supervisor field. {roots.length} {roots.length === 1 ? "employee has" : "employees have"} no manager on file (shown at top level — some may report to someone outside this location filter, or have no supervisor set in BambooHR).
            </div>
            {roots.length === 0 ? (
              <div style={{ padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>No reporting structure data available.</div>
            ) : (
              roots.map((r) => <OrgNode key={r.id} employee={r} childrenOf={childrenOf} depth={0} />)
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
