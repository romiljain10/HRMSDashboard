"use client";
import AppLayout from "@/components/AppLayout";
import Header from "@/components/Header";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState, useEffect, useCallback, useRef } from "react";
import { Download, Upload, CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";

function UploadCard({ title, description, templateHref, templateLabel, uploadState, onFileSelected }) {
  const inputRef = useRef(null);
  return (
    <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: 20, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>{description}</div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: uploadState.status !== "idle" ? 16 : 0 }}>
        <a href={templateHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 6, background: "white", color: "#2563eb", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
          <Download size={13} /> {templateLabel}
        </a>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "none", borderRadius: 6, background: "#2563eb", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Upload size={13} /> {uploadState.status === "uploading" ? "Uploading..." : "Upload Filled Template"}
          <input ref={inputRef} type="file" accept=".xlsx" onChange={(e) => onFileSelected(e, inputRef)} disabled={uploadState.status === "uploading"} style={{ display: "none" }} />
        </label>
      </div>

      {uploadState.status === "success" && (
        <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 6, padding: "10px 12px", fontSize: 12, color: "#166534" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <CheckCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>Saved {uploadState.inserted} row{uploadState.inserted !== 1 ? "s" : ""} for {uploadState.properties?.join(", ")}.</div>
          </div>
          {uploadState.warnings?.length > 0 && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #bbf7d0" }}>
              <div style={{ fontWeight: 600, color: "#a16207" }}>{uploadState.warnings.length} row{uploadState.warnings.length !== 1 ? "s" : ""} saved but couldn't be matched to an employee:</div>
              <ul style={{ margin: "4px 0 0 22px", padding: 0, color: "#a16207" }}>
                {uploadState.warnings.slice(0, 10).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
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
  );
}

function PerEmployeeTable({ title, items, loading }) {
  return (
    <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 14 }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{title}</div>
      {loading ? (
        <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>Nothing entered yet.</div>
      ) : (
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Property", "Employee", "Week", "Amount", "Burden %", "Total", "Match", "Entered By", "File"].map(h => (
                  <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{it.property}</td>
                  <td style={{ padding: "8px 12px", fontSize: 12 }}>{it.employeeName}</td>
                  <td style={{ padding: "8px 12px", fontSize: 12, color: "#475569", whiteSpace: "nowrap" }}>{it.weekStart} – {it.weekEnd}</td>
                  <td style={{ padding: "8px 12px", fontSize: 12 }}>${it.amount?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "8px 12px", fontSize: 12 }}>{it.burdenPct}%</td>
                  <td style={{ padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>${it.total?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: "8px 12px", fontSize: 11 }}>
                    {it.employeeId ? (
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "2px 7px", borderRadius: 999, fontWeight: 600 }}>Matched</span>
                    ) : (
                      <span style={{ background: "#fef9c3", color: "#a16207", padding: "2px 7px", borderRadius: 999, fontWeight: 600 }}>Unmatched</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: 12, color: "#475569" }}>{it.enteredBy}</td>
                  <td style={{ padding: "8px 12px", fontSize: 11, color: "#94a3b8" }}>
                    {it.sourceFileName ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FileSpreadsheet size={11} /> {it.sourceFileName}</span> : "Manual"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RevenuePage() {
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const canUpload = currentUser?.role === "Admin" || currentUser?.role === "Payroll Manager";

  const [uploads, setUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);
  const [uploadState, setUploadState] = useState({ status: "idle" });

  const [recentTips, setRecentTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [gratuityUploadState, setGratuityUploadState] = useState({ status: "idle" });

  const [recentBonuses, setRecentBonuses] = useState([]);
  const [bonusesLoading, setBonusesLoading] = useState(true);
  const [bonusUploadState, setBonusUploadState] = useState({ status: "idle" });

  const loadUploads = useCallback(async () => {
    if (!canUpload) return;
    setUploadsLoading(true);
    try {
      const res = await fetch("/api/revenue/recent");
      const json = await res.json();
      if (res.ok) setUploads(json.uploads || []);
    } catch {} finally { setUploadsLoading(false); }
  }, [canUpload]);

  const loadRecentTips = useCallback(async () => {
    if (!canUpload) return;
    setTipsLoading(true);
    try {
      const res = await fetch("/api/gratuity");
      const json = await res.json();
      if (res.ok) setRecentTips(json.items || []);
    } catch {} finally { setTipsLoading(false); }
  }, [canUpload]);

  const loadRecentBonuses = useCallback(async () => {
    if (!canUpload) return;
    setBonusesLoading(true);
    try {
      const res = await fetch("/api/bonus");
      const json = await res.json();
      if (res.ok) setRecentBonuses(json.items || []);
    } catch {} finally { setBonusesLoading(false); }
  }, [canUpload]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    loadUploads(); loadRecentTips(); loadRecentBonuses();
  }, [loadUploads, loadRecentTips, loadRecentBonuses]);

  async function handleFileSelected(e, inputRef) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState({ status: "uploading" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/revenue/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { setUploadState({ status: "error", message: json.error, details: json.details || [] }); return; }
      setUploadState({ status: "success", inserted: json.inserted, properties: json.properties });
      loadUploads();
    } catch {
      setUploadState({ status: "error", message: "Upload failed — check your connection and try again.", details: [] });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleGratuityFileUpload(e, inputRef) {
    const file = e.target.files?.[0];
    if (!file) return;
    setGratuityUploadState({ status: "uploading" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/gratuity/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { setGratuityUploadState({ status: "error", message: json.error, details: json.details || [] }); return; }
      setGratuityUploadState({ status: "success", inserted: json.inserted, properties: json.properties, warnings: json.warnings || [] });
      loadRecentTips();
    } catch {
      setGratuityUploadState({ status: "error", message: "Upload failed — check your connection and try again.", details: [] });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleBonusFileUpload(e, inputRef) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBonusUploadState({ status: "uploading" });
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/bonus/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { setBonusUploadState({ status: "error", message: json.error, details: json.details || [] }); return; }
      setBonusUploadState({ status: "success", inserted: json.inserted, properties: json.properties, warnings: json.warnings || [] });
      loadRecentBonuses();
    } catch {
      setBonusUploadState({ status: "error", message: "Upload failed — check your connection and try again.", details: [] });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (userLoading) return null;

  if (!canUpload) {
    return (
      <AppLayout>
        <Header title="Revenue" subtitle="Property revenue, gratuity & bonus data" />
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
      <Header title="Revenue" subtitle="Property revenue, gratuity & bonus data" />
      <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "#f0f4f8" }}>

        <UploadCard
          title="Upload Revenue Data"
          description="Download the template, fill in one row per property per period, then upload it back here."
          templateHref="/api/revenue/template"
          templateLabel="Download Template"
          uploadState={uploadState}
          onFileSelected={handleFileSelected}
        />

        <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 14 }}>
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

        <UploadCard
          title="Weekly Gratuity"
          description="One row per employee per week. Employee Name must match that employee's name at the given property — unmatched rows still save but are flagged below."
          templateHref="/api/gratuity/template"
          templateLabel="Download Gratuity Template"
          uploadState={gratuityUploadState}
          onFileSelected={handleGratuityFileUpload}
        />
        <PerEmployeeTable title="Recent Gratuity" items={recentTips} loading={tipsLoading} />

        <UploadCard
          title="Weekly Bonus"
          description="One row per employee per week. Employee Name must match that employee's name at the given property — unmatched rows still save but are flagged below."
          templateHref="/api/bonus/template"
          templateLabel="Download Bonus Template"
          uploadState={bonusUploadState}
          onFileSelected={handleBonusFileUpload}
        />
        <PerEmployeeTable title="Recent Bonuses" items={recentBonuses} loading={bonusesLoading} />

      </main>
    </AppLayout>
  );
}
