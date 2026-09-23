"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocationFilter } from "@/contexts/LocationContext";

export function useRevenueTrend(limit = 26) {
  const { location } = useLocationFilter();
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (location !== "All Locations") params.set("property", location);
      const res = await fetch(`/api/revenue/trend?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load revenue trend.");

      const snapshots = json.snapshots || [];

      if (location === "All Locations") {
        // Combine same-period snapshots across every property: sum the
        // additive figures, weight the rate figures by booked rooms.
        const byPeriod = new Map();
        for (const s of snapshots) {
          const key = s.periodStart;
          if (!byPeriod.has(key)) byPeriod.set(key, { periodStart: s.periodStart, totalRevenue: 0, roomRevenue: 0, bookedRooms: 0, occWeighted: 0, revparSum: 0, count: 0 });
          const bucket = byPeriod.get(key);
          bucket.totalRevenue += s.totalRevenue || 0;
          bucket.roomRevenue += s.roomRevenue || 0;
          bucket.bookedRooms += s.bookedRooms || 0;
          bucket.occWeighted += (s.occupancyPct || 0) * (s.bookedRooms || 0);
          bucket.revparSum += s.revpar || 0;
          bucket.count += 1;
        }
        const combined = [...byPeriod.values()]
          .sort((a, b) => a.periodStart.localeCompare(b.periodStart))
          .map((b) => ({
            periodStart: b.periodStart,
            totalRevenue: Math.round(b.totalRevenue * 100) / 100,
            occupancyPct: b.bookedRooms > 0 ? Math.round((b.occWeighted / b.bookedRooms) * 100) / 100 : 0,
            adr: b.bookedRooms > 0 ? Math.round((b.roomRevenue / b.bookedRooms) * 100) / 100 : 0,
            revpar: b.count > 0 ? Math.round((b.revparSum / b.count) * 100) / 100 : 0,
          }));
        setPoints(combined);
      } else {
        setPoints(snapshots.map((s) => ({
          periodStart: s.periodStart,
          totalRevenue: s.totalRevenue,
          occupancyPct: s.occupancyPct,
          adr: s.adr,
          revpar: s.revpar,
        })));
      }
    } catch (err) {
      setError(err.message || "Something went wrong loading the revenue trend.");
    } finally {
      setLoading(false);
    }
  }, [location, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-change
    load();
  }, [load]);

  return { points, loading, error, retry: load };
}
