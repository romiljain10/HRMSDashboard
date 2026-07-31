"use client";
import { Bell, Search, HelpCircle, ChevronDown, MapPin, Calendar, Users, Grid3X3, FileText, LogOut, AlertTriangle, Info } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocationFilter } from "@/contexts/LocationContext";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { REPORTS_CATALOG } from "@/lib/reports/catalog";
import { buildNotifications } from "@/lib/notifications";

export default function Header({ title, subtitle, locations }) {
  const router = useRouter();
  const { location, setLocation } = useLocationFilter();
  const { start, end, setDateRange, resetToCurrentWeek } = useDateRange();
  const [pickerOpen, setPickerOpen] = useState(false);
  const options = locations && locations.length ? locations : ["All Locations"];

  const { data } = useFilteredPayrollDataset();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const notifications = useMemo(() => buildNotifications(data), [data]);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const { user: currentUser } = useCurrentUser();
  const initials = currentUser?.name ? currentUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  useEffect(() => {
    function onClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { employees: [], departments: [], reports: [] };

    const employees = (data?.employees ?? [])
      .filter(e => e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q) || e.employeeNumber.toLowerCase().includes(q))
      .slice(0, 5);

    const departments = [...new Set((data?.employees ?? []).map(e => e.departmentGroup))]
      .filter(d => d && d.toLowerCase().includes(q))
      .slice(0, 5);

    const reports = REPORTS_CATALOG
      .filter(r => r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
      .slice(0, 5);

    return { employees, departments, reports };
  }, [query, data]);

  const hasResults = results.employees.length || results.departments.length || results.reports.length;

  function goTo(href) {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  }

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
        {/* Location — global filter, applies across every page */}
        <div className="header-location" style={{ position: "relative" }}>
          <MapPin size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              paddingLeft: 24, paddingRight: 22, paddingTop: 5, paddingBottom: 5,
              border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: "#f8fafc", outline: "none", color: "#0f172a", appearance: "none",
              maxWidth: 160, cursor: "pointer",
            }}
          >
            {options.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <ChevronDown size={11} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }} />
        </div>

        {/* Search — hidden on mobile, real: employees + departments + reports */}
        <div className="header-search" ref={searchBoxRef} style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            placeholder="Search employees, departments, reports..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            style={{
              paddingLeft: 26, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
              border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12,
              background: "#f8fafc", outline: "none", width: 200, color: "#0f172a",
            }} />
          {searchOpen && query.trim() && (
            <div style={{ position: "absolute", left: 0, top: "calc(100% + 6px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 60, width: 280, maxHeight: 340, overflowY: "auto" }}>
              {!hasResults && (
                <div style={{ padding: "14px 12px", fontSize: 12, color: "#94a3b8" }}>No matches for "{query}"</div>
              )}
              {results.employees.length > 0 && (
                <div>
                  <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Employees</div>
                  {results.employees.map(e => (
                    <button key={e.id} onClick={() => goTo(`/employees/${e.id}`)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                      <Users size={12} color="#64748b" />
                      <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{e.name}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{e.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.departments.length > 0 && (
                <div>
                  <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Departments</div>
                  {results.departments.map(d => (
                    <button key={d} onClick={() => goTo("/departments")} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                      <Grid3X3 size={12} color="#64748b" />
                      <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{d}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.reports.length > 0 && (
                <div>
                  <div style={{ padding: "8px 12px 4px", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Reports</div>
                  {results.reports.map(r => (
                    <button key={r.key} onClick={() => goTo(r.href)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>
                      <FileText size={12} color="#64748b" />
                      <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date range — hidden on mobile, real & synced with BambooHR */}
        <div className="header-daterange" style={{ position: "relative" }}>
          <button
            onClick={() => setPickerOpen((o) => !o)}
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", cursor: "pointer" }}
          >
            <Calendar size={11} />
            {formatDateRangeLabel(start, end)}
            <ChevronDown size={11} />
          </button>
          {pickerOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: 12, zIndex: 60, width: 240 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  Start
                  <input type="date" value={start} max={end}
                    onChange={(e) => setDateRange(e.target.value, end)}
                    style={{ display: "block", width: "100%", marginTop: 4, padding: "5px 6px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 12 }} />
                </label>
                <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  End
                  <input type="date" value={end} min={start}
                    onChange={(e) => setDateRange(start, e.target.value)}
                    style={{ display: "block", width: "100%", marginTop: 4, padding: "5px 6px", border: "1px solid #e2e8f0", borderRadius: 5, fontSize: 12 }} />
                </label>
                <button onClick={() => { resetToCurrentWeek(); setPickerOpen(false); }}
                  style={{ marginTop: 2, padding: "5px 8px", border: "1px solid #dbeafe", borderRadius: 5, background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Reset to last week
                </button>
                <button onClick={() => setPickerOpen(false)}
                  style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 5, background: "white", color: "#475569", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bell — real notifications, computed live */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", position: "relative", padding: 4 }}>
            <Bell size={18} />
            {notifications.length > 0 && (
              <span style={{ position: "absolute", top: 0, right: 0, background: "#dc2626", color: "white", borderRadius: "50%", width: 14, height: 14, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {notifications.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 60, width: 280, maxHeight: 360, overflowY: "auto" }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", fontSize: 11, fontWeight: 700, color: "#0f172a" }}>Notifications</div>
              {notifications.length === 0 ? (
                <div style={{ padding: "16px 12px", fontSize: 12, color: "#94a3b8" }}>All caught up — nothing needs attention.</div>
              ) : (
                notifications.map(n => (
                  <button key={n.id} onClick={() => { setNotifOpen(false); router.push(n.href); }} style={{ display: "flex", alignItems: "flex-start", gap: 8, width: "100%", padding: "9px 12px", border: "none", borderBottom: "1px solid #f8fafc", background: "none", cursor: "pointer", textAlign: "left" }}>
                    {n.severity === "alert" ? <AlertTriangle size={13} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} /> : n.severity === "warning" ? <AlertTriangle size={13} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} /> : <Info size={13} color="#64748b" style={{ marginTop: 1, flexShrink: 0 }} />}
                    <span style={{ fontSize: 12, color: "#0f172a", lineHeight: 1.4 }}>{n.message}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Help — hidden on mobile */}
        <button className="header-help" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
          <HelpCircle size={18} />
        </button>

        {/* User avatar always, label hidden on mobile */}
        <div ref={userMenuRef} style={{ position: "relative" }}>
          <div onClick={() => setUserMenuOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
            <div className="header-user-label" style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>{currentUser?.name || "Guest"}</div>
              <div style={{ color: "#64748b", fontSize: 10 }}>{currentUser?.role || ""}</div>
            </div>
            <ChevronDown size={11} color="#64748b" className="header-user-label" />
          </div>
          {userMenuOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", zIndex: 60, width: 160, overflow: "hidden" }}>
              <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: 12, color: "#dc2626", fontWeight: 600 }}>
                <LogOut size={13} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
