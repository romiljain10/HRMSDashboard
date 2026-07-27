"use client";
import { useCallback, useEffect, useState } from "react";

export function usePayrollDataset() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bamboo/payroll", { cache: "no-store" });
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
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount; setState happens inside the async callback, not synchronously in the effect body
    load();
  }, [load]);

  return { data, loading, error, retry: load };
}
