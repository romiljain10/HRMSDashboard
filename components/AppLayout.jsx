"use client";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "100vh", minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
