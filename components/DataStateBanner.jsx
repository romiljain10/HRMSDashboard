"use client";
import { AlertTriangle, Loader2 } from "lucide-react";

export function DataStateBanner({ loading, error, onRetry, degraded, degradedMessage }) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 14, color: "#64748b", fontSize: 12 }}>
        <Loader2 size={14} className="spin" style={{ animation: "spin 0.8s linear infinite" }} />
        Loading live data from BambooHR…
        <style>{"@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }"}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 14px", marginBottom: 14, color: "#b91c1c", fontSize: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={14} /> {error}
        </span>
        <button onClick={onRetry} style={{ padding: "4px 10px", border: "1px solid #fecaca", borderRadius: 6, background: "white", color: "#b91c1c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Retry
        </button>
      </div>
    );
  }

  if (degraded) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#92400e", fontSize: 12 }}>
        <AlertTriangle size={14} />
        {degradedMessage || "Live hours from BambooHR Time Tracking are unavailable right now — showing 0 hrs until it reconnects."}
      </div>
    );
  }

  return null;
}
