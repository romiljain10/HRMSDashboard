"use client";
import { createContext, useContext, useState } from "react";

const DateRangeContext = createContext(null);

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Default: July 1, 2026 through today (real "today", not fixed) — the
// range requested for reviewing this period's data. Use the header date
// picker to view a different range; "Reset" below returns to this default.
function defaultRange() {
  const start = "2026-07-01";
  const end = toISODate(new Date());
  return { start, end };
}

export function DateRangeProvider({ children }) {
  const [{ start, end }, setRange] = useState(defaultRange());

  function setDateRange(newStart, newEnd) {
    if (newStart && newEnd && newStart <= newEnd) {
      setRange({ start: newStart, end: newEnd });
    }
  }

  function resetToCurrentWeek() {
    setRange(defaultRange());
  }

  return (
    <DateRangeContext.Provider value={{ start, end, setDateRange, resetToCurrentWeek }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error("useDateRange must be used within a DateRangeProvider");
  return ctx;
}

export function formatDateRangeLabel(start, end) {
  if (!start || !end) return "";
  const opts = { month: "short", day: "numeric" };
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}, ${e.getFullYear()}`;
}
