"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useLocationFilter } from "@/contexts/LocationContext";
import { useDateRange, formatDateRangeLabel } from "@/contexts/DateRangeContext";
import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Upload, CheckCircle, AlertTriangle, FileSpreadsheet, DollarSign, Plus, X } from "lucide-react";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";

export default function RevenuePage() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const { location } = useLocationFilter();
  const { start, end } = useDateRange();
  const { locations } = useFilteredPayrollDataset();
  const realLocations = locations.filter((l) => l !== "All Locations");
  const canUpload = currentUser?.role === "Admin" || currentUser?.role === "Payroll Manager";

  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [uploadState, setUploadState] = useState({ status: "idle" }); // idle | uploading | success | error
  const fileInputRef = useRef(null);

  const [tipRows, setTipRows] = useState([{ property: location !== "All Locations" ? location : "", amount: "" }]);
  const [tipState, setTipState] = useState({ status: "idle" });
  const [recentTips, setRecentTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);

  const loadRecentTips = useCallback(async () => {
    if (!canUpload) return;
    setTipsLoading(true);
    try {
      const res = await fetch("/api/tips");
      const json = await res.json();
      if (res.ok) setRecentTips(json.tips || []);
    } catch {
      // non-fatal
    } finally {
      setTipsLoading(false);
    }
  }, [canUpload]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    loadRecentTips();
  }, [loadRecentTips]);

  useEffect(() => {
    if (location !== "All Locations") {
      setTipRows((rows) => (rows.length === 1 && !rows[0].property && !rows[0].amount ? [{ property: location, amount: "" }] : rows));
    }
  }, [location]);

  function updateTipRow(index, field, value) {
    setTipRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function addTipRow() {
    setTipRows((rows) => [...rows, { property: "", amount: "" }]);
  }

  function removeTipRow(index) {
    setTipRows((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : rows));
  }

  async function handleTipSubmit(e) {
    e.preventDefault();
    const validRows = tipRows.filter((r) => r.property && r.amount !== "");
    if (validRows.length === 0) {
      setTipState({ status: "error", message: "Fill in at least one property and amount." });
      return;
    }
    setTipState({ status: "saving" });
    try {
      const results = await Promise.all(
        validRows.map((row) =>
          fetch("/api/tips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ property: row.property, weekStart: start, weekEnd: end, amount: row.amount }),
          }).then(async (res) => ({ ok: res.ok, property: row.property, error: (await res.json().catch(() => ({}))).error }))
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        setTipState({ status: "error", message: failed.map((f) => `${f.property}: ${f.error}`).join(" · ") });
        return;
      }
      setTipState({ status: "success" });
      setTipRows([{ property: location !== "All Locations" ? location : "", amount: "" }]);
      loadRecentTips();
    } catch {
      setTipState({ status: "error", message: "Save failed — check your connection and try again." });
    }
  }

  const loadUploads = useCallback(async () => {
    if (!canUpload) return;
    setUploadsLoading(true);
    try {
      const res = await fetch("/api/revenue/recent");
      const json = await res.json();
      if (res.ok) setUploads(json.uploads || []);
    } catch {
      // non-fatal — audit table just stays empty
    } finally {
      setUploadsLoading(false);
    }
  }, [canUpload]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    loadUploads();
  }, [loadUploads]);

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadState({ status: "uploading" });
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/revenue/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setUploadState({ status: "error", message: json.error, details: json.details || [] });
        return;
      }
      setUploadState({ status: "success", inserted: json.inserted, properties: json.properties });
      loadUploads();
    } catch (err) {
      setUploadState({ status: "error", message: "Upload failed — check your connection and try again.", details: [] });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (userLoading) return null;

  if (!canUpload) {
    return (
      <AppLayout>
        <Header title="Revenue" subtitle="Property revenue & occupancy data" />
        <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>
          <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            Revenue data upload requires Payroll Manager or Admin access. Signed in as {currentUser?.name} ({currentUser?.role}).
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header title="Revenue" subtitle="Property revenue & occupancy data" />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        {/* Upload card */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 20, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>Upload Revenue Data</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
            Download the template, fill in one row per property per period, then upload it back here.
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: uploadState.status !== "idle" ? 16 : 0 }}>
            <a href="/api/revenue/template" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 6, background: "white", color: "#2563eb", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
              <Download size={13} /> Download Template
            </a>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 6, background: "#2563eb", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Upload size={13} /> {uploadState.status === "uploading" ? "Uploading..." : "Upload Filled Template"}
              <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileSelected} disabled={uploadState.status === "uploading"} style={{ display: "none" }} />
            </label>
          </div>

          {uploadState.status === "success" && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 6, padding: "10px 12px", fontSize: 12, color: "#166534" }}>
              <CheckCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                Saved {uploadState.inserted} row{uploadState.inserted !== 1 ? "s" : ""} for {uploadState.properties?.join(", ")}.
              </div>
            </div>
          )}

          {uploadState.status === "error" && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "10px 12px", fontSize: 12, color: "#b91c1c" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontWeight: 600, marginBottom: uploadState.details?.length ? 6 : 0 }}>
                <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                {uploadState.message}
              </div>
              {uploadState.details?.length > 0 && (
                <ul style={{ margin: "4px 0 0 22px", padding: 0 }}>
                  {uploadState.details.slice(0, 20).map((d, i) => <li key={i}>{d}</li>)}
                  {uploadState.details.length > 20 && <li>...and {uploadState.details.length - 20} more.</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Audit trail */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Recent Uploads</div>
          {uploadsLoading ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>Loading...</div>
          ) : uploads.length === 0 ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>No revenue data uploaded yet.</div>
          ) : (
            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Property", "Period", "Occupancy", "ADR", "RevPAR", "Total Revenue", "Uploaded By", "Uploaded At", "File"].map(h => (
                      <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((u, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{u.property}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>{u.periodStart} – {u.periodEnd}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12 }}>{u.occupancyPct?.toFixed(2)}%</td>
                      <td style={{ padding: "8px 12px", fontSize: 12 }}>${u.adr?.toFixed(2)}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12 }}>${u.revpar?.toFixed(2)}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>${u.totalRevenue?.toLocaleString("en-US")}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#475569" }}>{u.uploadedBy}</td>
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{new Date(u.uploadedAt).toLocaleString("en-US")}</td>
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FileSpreadsheet size={11} /> {u.sourceFileName}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Weekly Tips */}
        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 20, marginTop: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>Weekly Tips</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
            One entry per property per week — matches the payroll week currently selected ({formatDateRangeLabel(start, end)}). Re-submitting the same week corrects it.
          </div>

          <form onSubmit={handleTipSubmit} style={{ marginBottom: tipState.status !== "idle" ? 12 : 0 }}>
            {tipRows.map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 8 }}>
                <div>
                  {i === 0 && <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Property</label>}
                  <select value={row.property} onChange={(e) => updateTipRow(i, "property", e.target.value)}
                    style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, width: 220 }}>
                    <option value="">Select a property...</option>
                    {realLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div>
                  {i === 0 && <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Tip Amount ($)</label>}
                  <input type="number" min="0" step="0.01" value={row.amount} onChange={(e) => updateTipRow(i, "amount", e.target.value)} placeholder="0.00"
                    style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, width: 140 }} />
                </div>
                {tipRows.length > 1 && (
                  <button type="button" onClick={() => removeTipRow(i)} title="Remove row" style={{ padding: 8, border: "1px solid #e2e8f0", borderRadius: 6, background: "white", color: "#94a3b8", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                )}
                {i === tipRows.length - 1 && (
                  <button type="button" onClick={addTipRow} title="Add another property" style={{ padding: 8, border: "1px solid #dbeafe", borderRadius: 6, background: "#eff6ff", color: "#1d4ed8", cursor: "pointer" }}>
                    <Plus size={14} />
                  </button>
                )}
              </div>
            ))}
            <button type="submit" disabled={tipState.status === "saving"} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 6, background: "#2563eb", color: "white", fontSize: 12, fontWeight: 600, cursor: tipState.status === "saving" ? "default" : "pointer", marginTop: 4 }}>
              <DollarSign size={13} /> {tipState.status === "saving" ? "Saving..." : "Save All"}
            </button>
          </form>

          {tipState.status === "success" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#166534" }}>
              <CheckCircle size={13} /> Saved.
            </div>
          )}
          {tipState.status === "error" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#b91c1c" }}>
              <AlertTriangle size={13} /> {tipState.message}
            </div>
          )}
        </div>

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Recent Tips</div>
          {tipsLoading ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>Loading...</div>
          ) : recentTips.length === 0 ? (
            <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>No tips entered yet.</div>
          ) : (
            <div className="table-scroll">
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Property", "Week", "Amount", "Entered By", "Entered At"].map(h => (
                      <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTips.map((t, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{t.property}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>{t.weekStart} – {t.weekEnd}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600 }}>${t.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: "#475569" }}>{t.enteredBy}</td>
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{new Date(t.enteredAt).toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
