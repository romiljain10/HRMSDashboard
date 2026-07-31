"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Login failed.");
        return;
      }
      router.push(searchParams.get("redirect") || "/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8", padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: 32, width: "100%", maxWidth: 360, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <img src="/logo-full.png" alt="Hotel HR" style={{ height: 64, width: "auto", objectFit: "contain" }} />
        </div>

        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Username</label>
        <div style={{ marginTop: 6, marginBottom: 14 }}>
          <input
            type="text"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{ width: "100%", paddingLeft: 10, paddingRight: 10, paddingTop: 9, paddingBottom: 9, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none" }}
          />
        </div>

        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Password</label>
        <div style={{ position: "relative", marginTop: 6, marginBottom: 14 }}>
          <Lock size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 9, paddingBottom: 9, border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none" }}
          />
        </div>

        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 6, padding: "8px 10px", fontSize: 12, marginBottom: 14 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px 0", background: "#2563eb", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
