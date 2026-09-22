"use client";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", height: "100vh", minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
