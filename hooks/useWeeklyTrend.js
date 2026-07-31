"use client";
import { useCallback, useEffect, useState } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useLocationFilter } from "@/contexts/LocationContext";

function groupKey(name) {
  return (name || "Unassigned").replace(/[^a-zA-Z0-9]/g, "") || "Unassigned";
}

export function useWeeklyTrend(weeks = 6) {
  const { end } = useDateRange();
  const { location } = useLocationFilter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bamboo/trend?end=${end}&weeks=${weeks}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || "Failed to load trend.");
      setData(json);
    } catch (err) {
      setError(err.message || "Something went wrong loading the trend.");
    } finally {
      setLoading(false);
    }
  }, [end, weeks]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-change
    load();
  }, [load]);

  const rawWeeks = data?.weeks ?? [];

  // Every group name that appears anywhere across the fetched weeks, so
  // every Line in the chart stays consistent even if a group has $0 in
  // some weeks.
  const groupNames = [...new Set(rawWeeks.flatMap((w) => w.employeeCosts.map((e) => e.departmentGroup)))];

  const chartData = rawWeeks.map((w) => {
    const filtered = location === "All Locations" ? w.employeeCosts : w.employeeCosts.filter((e) => e.location === location);
    const row = { week: w.weekLabel };
    for (const name of groupNames) row[groupKey(name)] = 0;
    for (const e of filtered) {
      const key = groupKey(e.departmentGroup);
      row[key] = Math.round(((row[key] || 0) + e.totalCost) * 100) / 100;
    }
    return row;
  });

  const groups = groupNames.map((name) => ({ name, key: groupKey(name) }));

  return { chartData, groups, loading, error, retry: load };
}
