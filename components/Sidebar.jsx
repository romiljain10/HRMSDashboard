"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, DollarSign, Grid3X3,
  FileText, Settings, ChevronLeft, ChevronRight, Building2, Menu, X, Network, TrendingUp
} from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const navItems = [
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard },
  { href: "/employees",   label: "Employees",  icon: Users },
  { href: "/departments", label: "Departments",icon: Grid3X3 },
  { href: "/payroll",     label: "Payroll",    icon: DollarSign },
  { href: "/revenue",     label: "Revenue",    icon: TrendingUp, roles: ["Admin", "Payroll Manager"] },
  { href: "/reports",     label: "Reports",    icon: FileText },
  { href: "/settings",    label: "Settings",   icon: Settings },
];

const mobileNav = [
  { href: "/dashboard",   label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees",   label: "Employees", icon: Users },
  { href: "/payroll",     label: "Payroll",   icon: DollarSign },
  { href: "/departments", label: "Depts",     icon: Grid3X3 },
  { href: "/reports",     label: "Reports",   icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user: currentUser } = useCurrentUser();
  const visibleNavItems = navItems.filter((item) => !item.roles || item.roles.includes(currentUser?.role));

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="desktop-sidebar" style={{
        width: collapsed ? 64 : 230,
        background: "#0f2044",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s",
        flexShrink: 0,
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: collapsed ? "14px 10px" : "14px 16px", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ background: "white", borderRadius: 8, padding: collapsed ? 4 : 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {collapsed ? (
              <img src="/logo-icon.png" alt="Hotel HR" style={{ width: 28, height: 28, objectFit: "contain", display: "block" }} />
            ) : (
              <img src="/logo-full.png" alt="Hotel HR" style={{ height: 40, width: "auto", objectFit: "contain", display: "block" }} />
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {visibleNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 12px" : "9px 12px",
                borderRadius: 6, marginBottom: 2, textDecoration: "none",
                background: active ? "#2563eb" : "transparent",
                color: active ? "white" : "#94a3b8",
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: "all 0.15s",
              }}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <button onClick={() => setCollapsed(!collapsed)} style={{
          margin: "8px", padding: "8px", borderRadius: 6, border: "none",
          background: "#1e3a5f", color: "#94a3b8", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
        }} />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <aside style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 260,
        background: "#0f2044", zIndex: 201,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column",
      }} className="mobile-drawer">
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #1e3a5f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ background: "white", borderRadius: 8, padding: 5, display: "flex", alignItems: "center" }}>
            <img src="/logo-full.png" alt="Hotel HR" style={{ height: 32, width: "auto", objectFit: "contain", display: "block" }} />
          </div>
          <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
            <X size={18} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {visibleNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                borderRadius: 6, marginBottom: 2, textDecoration: "none",
                background: active ? "#2563eb" : "transparent",
                color: active ? "white" : "#94a3b8",
                fontSize: 14, fontWeight: active ? 600 : 400,
              }}>
                <Icon size={18} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <script dangerouslySetInnerHTML={{ __html: `window.__openMobileMenu = null;` }} />

      {/* ── Mobile bottom nav bar ── */}
      <nav className="mobile-nav" style={{ justifyContent: "space-around", alignItems: "center" }}>
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              textDecoration: "none", padding: "4px 8px",
              color: active ? "#60a5fa" : "#64748b",
            }}>
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMobileOpen(true)} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
          color: "#64748b",
        }}>
          <Menu size={20} />
          <span style={{ fontSize: 10 }}>More</span>
        </button>
      </nav>
    </>
  );
}
