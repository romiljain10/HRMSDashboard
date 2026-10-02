"use client";
import { useState, useEffect, useCallback } from "react";
import { DollarSign, MapPin, Trash2, Plus } from "lucide-react";
import { US_STATES } from "@/lib/payroll/usStates";
import { useFilteredPayrollDataset } from "@/hooks/useFilteredPayrollDataset";

export default function PayrollSettingsSection({ canEdit }) {
  const { locations } = useFilteredPayrollDataset();
  const realLocations = locations.filter((l) => l !== "All Locations");

  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [newRateState, setNewRateState] = useState(US_STATES[0]);
  const [newRatePct, setNewRatePct] = useState("");
  const [rateError, setRateError] = useState("");

  const [mappings, setMappings] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(true);
  const [newMappingProperty, setNewMappingProperty] = useState("");
  const [newMappingState, setNewMappingState] = useState(US_STATES[0]);
  const [mappingError, setMappingError] = useState("");

  const loadRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch("/api/payroll-settings/state-rates");
      const json = await res.json();
      if (res.ok) setRates(json.rates || []);
    } catch {} finally { setRatesLoading(false); }
  }, []);

  const loadMappings = useCallback(async () => {
    setMappingsLoading(true);
    try {
      const res = await fetch("/api/payroll-settings/property-states");
      const json = await res.json();
      if (res.ok) setMappings(json.mappings || []);
    } catch {} finally { setMappingsLoading(false); }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount
    loadRates(); loadMappings();
  }, [loadRates, loadMappings]);

  useEffect(() => {
    if (realLocations.length > 0 && !newMappingProperty) setNewMappingProperty(realLocations[0]);
  }, [realLocations, newMappingProperty]);

  async function addRate(e) {
    e.preventDefault();
    setRateError("");
    const res = await fetch("/api/payroll-settings/state-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: newRateState, burdenPct: newRatePct }),
    });
    const json = await res.json();
    if (!res.ok) { setRateError(json.error); return; }
    setNewRatePct("");
    loadRates();
  }

  async function deleteRate(state) {
    await fetch(`/api/payroll-settings/state-rates?state=${encodeURIComponent(state)}`, { method: "DELETE" });
    loadRates();
  }

  async function addMapping(e) {
    e.preventDefault();
    setMappingError("");
    const res = await fetch("/api/payroll-settings/property-states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property: newMappingProperty, state: newMappingState }),
    });
    const json = await res.json();
    if (!res.ok) { setMappingError(json.error); return; }
    loadMappings();
  }

  async function deleteMapping(property) {
    await fetch(`/api/payroll-settings/property-states?property=${encodeURIComponent(property)}`, { method: "DELETE" });
    loadMappings();
  }

  if (!canEdit) {
    return (
      <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", padding: "16px 14px", fontSize: 12, color: "#94a3b8" }}>
        Only Admins can manage Payroll Settings.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Property -> State assignment */}
      <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={13} /> Property → State
        </div>
        <div style={{ padding: 14 }}>
          <form onSubmit={addMapping} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Property</label>
              <select value={newMappingProperty} onChange={(e) => setNewMappingProperty(e.target.value)} style={{ padding: "7px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, minWidth: 180 }}>
                {realLocations.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>State</label>
              <select value={newMappingState} onChange={(e) => setNewMappingState(e.target.value)} style={{ padding: "7px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, minWidth: 160 }}>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#2563eb", color: "white", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={12} /> Assign
            </button>
          </form>
          {mappingError && <div style={{ fontSize: 11, color: "#b91c1c", marginBottom: 10 }}>{mappingError}</div>}
          {mappingsLoading ? (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Loading...</div>
          ) : mappings.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>No properties assigned to a state yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {mappings.map((m) => (
                <div key={m.property} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
                  <span><strong>{m.property}</strong> → {m.state}</span>
                  <button onClick={() => deleteMapping(m.property)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* State burden rates */}
      <div style={{ background: "white", borderRadius: 8, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
          <DollarSign size={13} /> Burden % by State
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
            A property assigned to a state above uses that state's rate instead of the default. Properties with no state assignment, or a state with no rate set here, keep using the standard rate.
          </div>
          <form onSubmit={addRate} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>State</label>
              <select value={newRateState} onChange={(e) => setNewRateState(e.target.value)} style={{ padding: "7px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, minWidth: 160 }}>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Burden % (e.g. 27.50)</label>
              <input type="number" min="0" max="100" step="0.01" value={newRatePct} onChange={(e) => setNewRatePct(e.target.value)} required
                style={{ padding: "7px 9px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, width: 140 }} />
            </div>
            <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#2563eb", color: "white", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={12} /> Save Rate
            </button>
          </form>
          {rateError && <div style={{ fontSize: 11, color: "#b91c1c", marginBottom: 10 }}>{rateError}</div>}
          {ratesLoading ? (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Loading...</div>
          ) : rates.length === 0 ? (
            <div style={{ fontSize: 12, color: "#94a3b8" }}>No state-specific rates configured yet — every property uses the standard rate.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rates.map((r) => (
                <div key={r.state} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#f8fafc", borderRadius: 6, fontSize: 12 }}>
                  <span><strong>{r.state}</strong>: {r.burdenPct}%</span>
                  <button onClick={() => deleteRate(r.state)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
