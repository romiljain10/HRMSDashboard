"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocationFilter } from "@/contexts/LocationContext";
import { useDateRange } from "@/contexts/DateRangeContext";

export function useWeeklyTips() {
  const { location } = useLocationFilter();
  const { start } = useDateRange();
  const [tips, setTips] = useState([]); // one entry per property when "All Locations"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ weekStart: start });
      if (location !== "All Locations") params.set("property", location);
      const res = await fetch(`/api/tips?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load tips.");
      setTips(json.tips || []);
    } catch (err) {
      setError(err.message || "Something went wrong loading tips.");
    } finally {
      setLoading(false);
    }
  }, [location, start]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-change
    load();
  }, [load]);

  const total = tips.reduce((s, t) => s + (t.amount || 0), 0);
  // For a single-property view, has this exact week actually been entered?
  const enteredForCurrentSelection = location === "All Locations" ? tips.length > 0 : tips.some((t) => t.property === location);

  return { tips, total, enteredForCurrentSelection, loading, error, retry: load };
}
