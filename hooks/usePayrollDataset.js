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
      // The server can answer with an HTML error page (timeout / crash /
      // expired login) instead of JSON, so read as text and explain it.
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* not JSON */ }
      if (!json) {
        if (res.redirected || res.url.includes("/login")) throw new Error("Your session has expired. Please sign in again.");
        throw new Error(
          res.status === 504 || res.status === 408
            ? "BambooHR took too long to respond. Please press Retry."
            : "The server returned an unexpected response (status " + res.status + "). Please press Retry."
        );
      }
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
