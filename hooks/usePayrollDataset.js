"use client";
import { useCallback, useEffect, useState } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";

export function usePayrollDataset() {
  const { start, end } = useDateRange();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bamboo/payroll?start=${start}&end=${end}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || "Failed to load payroll data.");
      }
      setData(json);
    } catch (err) {
      setError(err.message || "Something went wrong loading payroll data.");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/on-range-change; setState happens inside the async callback, not synchronously in the effect body
    load();
  }, [load]);

  return { data, loading, error, retry: load };
}
