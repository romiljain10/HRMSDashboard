"use client";
import { Bell, Search, HelpCircle, ChevronDown } from "lucide-react";

export default function Header({ title, subtitle }) {
  return (
    <header style={{
      background: "white",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 16px",
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 10, color: "#64748b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</p>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Search — hidden on mobile */}
        <div className="header-search" style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input placeholder="Search..." style={{
            paddingLeft: 26, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
            border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12,
            background: "#f8fafc", outline: "none", width: 160, color: "#0f172a",
          }} />
        </div>

        {/* Date — hidden on mobile */}
        <div className="header-daterange" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" }}>
          Apr 27 – May 3, 2026 <ChevronDown size={11} />
        </div>

        {/* Bell — always visible */}
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", position: "relative", padding: 4 }}>
          <Bell size={18} />
          <span style={{ position: "absolute", top: 0, right: 0, background: "#dc2626", color: "white", borderRadius: "50%", width: 14, height: 14, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>3</span>
        </button>

        {/* Help — hidden on mobile */}
        <button className="header-help" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
          <HelpCircle size={18} />
        </button>

        {/* User avatar always, label hidden on mobile */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>JS</div>
          <div className="header-user-label" style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>John Smith</div>
            <div style={{ color: "#64748b", fontSize: 10 }}>HR Admin</div>
          </div>
          <ChevronDown size={11} color="#64748b" className="header-user-label" />
        </div>
      </div>
    </header>
  );
}
