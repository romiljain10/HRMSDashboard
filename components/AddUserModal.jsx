"use client";
import { useState } from "react";
import { X, UserPlus } from "lucide-react";

export default function AddUserModal({ onClose, onCreated }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Viewer");
  const [state, setState] = useState({ status: "idle" });

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ status: "saving" });
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, password, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: json.error });
        return;
      }
      onCreated?.();
      onClose();
    } catch {
      setState({ status: "error", message: "Failed to create user — check your connection and try again." });
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 10, width: "100%", maxWidth: 380, padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
            <UserPlus size={14} /> Add User
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Full Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Password (min 8 characters)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12 }}>
              <option value="Admin">Admin</option>
              <option value="Payroll Manager">Payroll Manager</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          {state.status === "error" && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 10px", fontSize: 12, color: "#b91c1c" }}>{state.message}</div>
          )}

          <button type="submit" disabled={state.status === "saving"} style={{ marginTop: 4, padding: "9px 0", background: "#2563eb", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: state.status === "saving" ? "default" : "pointer" }}>
            {state.status === "saving" ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
