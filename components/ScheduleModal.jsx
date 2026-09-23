"use client";
import { useState } from "react";
import { X, Calendar } from "lucide-react";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ScheduleModal({ report, onClose, onCreated }) {
  const [recipients, setRecipients] = useState("");
  const [frequency, setFrequency] = useState("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [format, setFormat] = useState("XLSX");
  const [state, setState] = useState({ status: "idle" });

  async function handleSubmit(e) {
    e.preventDefault();
    const emails = recipients.split(",").map((r) => r.trim()).filter(Boolean);
    if (emails.length === 0) {
      setState({ status: "error", message: "Enter at least one recipient email." });
      return;
    }
    setState({ status: "saving" });
    try {
      const res = await fetch("/api/report-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportKey: report.key,
          recipients: emails,
          frequency,
          dayOfWeek: frequency === "weekly" ? Number(dayOfWeek) : undefined,
          dayOfMonth: frequency === "monthly" ? Number(dayOfMonth) : undefined,
          format: report.isReminder ? undefined : format,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: json.error });
        return;
      }
      onCreated?.();
      onClose();
    } catch {
      setState({ status: "error", message: "Failed to save — check your connection and try again." });
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 10, width: "100%", maxWidth: 420, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={14} /> Schedule Report
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>{report.name}</div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Recipients (comma-separated)</label>
            <input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="jane@hotel.com, ops@hotel.com" required
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {!report.isReminder && (
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }}>
                <option value="XLSX">XLSX</option>
                <option value="CSV">CSV</option>
              </select>
            </div>
            )}
          </div>

          {frequency === "weekly" ? (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Day of Week</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }}>
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Day of Month (1–28)</label>
              <input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }} />
            </div>
          )}

          <div style={{ fontSize: 10, color: "#94a3b8" }}>Each send covers the most recently completed Mon–Sun week.</div>

          {state.status === "error" && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#b91c1c" }}>{state.message}</div>
          )}

          <button type="submit" disabled={state.status === "saving"} style={{ marginTop: 4, padding: "9px 0", background: "#2563eb", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: state.status === "saving" ? "default" : "pointer" }}>
            {state.status === "saving" ? "Saving..." : "Create Schedule"}
          </button>
        </form>
      </div>
    </div>
  );
}
