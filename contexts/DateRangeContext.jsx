"use client";
import { createContext, useContext, useState } from "react";

const DateRangeContext = createContext(null);

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Default: the Mon–Sun week immediately before the current one (i.e. "last
// week"), computed from today's real date. Use the header date picker to
// view a different range; "Reset" below returns to this default.
function defaultRange() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToThisMonday = day === 0 ? -6 : 1 - day;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + diffToThisMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  return { start: toISODate(lastMonday), end: toISODate(lastSunday) };
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
