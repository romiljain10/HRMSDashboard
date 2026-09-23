"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState, useEffect, useCallback } from "react";
import { Upload, DollarSign, UserPlus, Calendar, History } from "lucide-react";

const TYPE_CONFIG = {
  revenue_upload: { icon: Upload, color: "#2563eb", label: "Revenue Upload" },
  tips_entry: { icon: DollarSign, color: "#059669", label: "Tips Entry" },
  user_created: { icon: UserPlus, color: "#7c3aed", label: "User Created" },
  schedule_created: { icon: Calendar, color: "#d97706", label: "Schedule Created" },
};

export default function AuditLogPage() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const load = useCallback(() => {
    if (currentUser?.role !== "Admin") return;
    setLoading(true);
    fetch("/api/audit-log")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setEvents(json.events || []);
      })
      .catch(() => setError("Failed to load audit log."))
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    load();
  }, [load]);

  const filtered = typeFilter === "All" ? events : events.filter((e) => e.type === typeFilter);

  if (userLoading) return null;

  if (currentUser?.role !== "Admin") {
    return (
      <AppLayout>
        <Header title="Audit Log" subtitle="Who did what, when" />
        <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            Audit log requires Admin access. Signed in as {currentUser?.name} ({currentUser?.role}).
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header title="Audit Log" subtitle="Who did what, when" />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }}>
            <option value="All">All Event Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{filtered.length} event{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
            <History size={13} /> Recent Activity
          </div>
          {loading ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#b91c1c" }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>No events yet.</div>
          ) : (
            <div>
              {filtered.map((event, i) => {
                const cfg = TYPE_CONFIG[event.type] || { icon: History, color: "#64748b", label: event.type };
                const Icon = cfg.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderBottom: "1px solid #f8fafc" }}>
                    <div style={{ background: cfg.color + "15", borderRadius: 6, padding: 6, flexShrink: 0, marginTop: 1 }}>
                      <Icon size={13} color={cfg.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#0f172a" }}>{event.summary}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                        {event.actor} · {new Date(event.at).toLocaleString("en-US")}
                        {event.detail && ` · ${event.detail}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
