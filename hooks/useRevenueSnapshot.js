"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocationFilter } from "@/contexts/LocationContext";

export function useRevenueSnapshot() {
  const { location } = useLocationFilter();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/revenue/latest?property=${encodeURIComponent(location)}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load revenue data.");

      const snapshots = json.snapshots || [];
      if (location === "All Locations") {
        // Combine across properties: sum the additive figures, average the rates.
        if (snapshots.length === 0) {
          setSnapshot(null);
        } else {
          const sum = (key) => snapshots.reduce((s, x) => s + (x[key] || 0), 0);
          const totalRevenue = sum("totalRevenue");
          const roomRevenue = sum("roomRevenue");
          const bookedRooms = sum("bookedRooms");
          const weightedOcc = snapshots.reduce((s, x) => s + (x.occupancyPct || 0) * (x.bookedRooms || 0), 0);
          setSnapshot({
            property: "All Locations",
            totalRevenue,
            roomRevenue,
            bookedRooms,
            occupancyPct: bookedRooms > 0 ? weightedOcc / bookedRooms : 0,
            adr: bookedRooms > 0 ? roomRevenue / bookedRooms : 0,
            revpar: snapshots.length > 0 ? sum("revpar") / snapshots.length : 0,
            propertiesIncluded: snapshots.length,
          });
        }
      } else {
        setSnapshot(snapshots[0] || null);
      }
    } catch (err) {
      setError(err.message || "Something went wrong loading revenue data.");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-change
    load();
  }, [load]);

  return { snapshot, loading, error, retry: load };
}
