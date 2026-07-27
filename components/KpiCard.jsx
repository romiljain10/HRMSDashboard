import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function KpiCard({ title, value, budget, priorYear, budgetVar, pyVar, icon: Icon, format = "number", size = "md", accent = false }) {
  const isPositiveGood = !["Labor %", "Payroll % Revenue", "Labor Cost / Occ Room", "Labor Cost / Avail Room", "OT Hours"].includes(title);

  function renderVar(val, label) {
    if (val === undefined || val === null) return null;
    const good = isPositiveGood ? val >= 0 : val <= 0;
    const color = good ? "#16a34a" : "#dc2626";
    const Icon2 = val > 0 ? TrendingUp : val < 0 ? TrendingDown : Minus;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color, marginTop: 2 }}>
        <Icon2 size={10} />
        <span>{val > 0 ? "+" : ""}{val.toFixed(1)}{format === "pct" ? "pp" : "%"} vs {label}</span>
      </div>
    );
  }

  return (
    <div style={{
      background: accent ? "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)" : "white",
      border: "1px solid #e2e8f0", borderRadius: 8, padding: size === "sm" ? "12px 14px" : "16px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: accent ? "rgba(255,255,255,0.7)" : "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
        {Icon && <div style={{ background: accent ? "rgba(255,255,255,0.15)" : "#dbeafe", borderRadius: 6, padding: 5 }}><Icon size={14} color={accent ? "white" : "#2563eb"} /></div>}
      </div>
      <div style={{ fontSize: size === "sm" ? 20 : 26, fontWeight: 800, color: accent ? "white" : "#0f172a", lineHeight: 1 }}>{value}</div>
      {budget !== undefined && (
        <div style={{ fontSize: 10, color: accent ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>
          Budget: <span style={{ fontWeight: 600 }}>{budget}</span>
        </div>
      )}
      <div>
        {renderVar(budgetVar, "Budget")}
        {renderVar(pyVar, "PY")}
      </div>
    </div>
  );
}
