"use client";
import { createContext, useContext, useState } from "react";

const DateRangeContext = createContext(null);

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

// Default: the Mon–Sun week containing today's real date (not a fixed date).
function currentWeek() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toISODate(monday), end: toISODate(sunday) };
}

export function DateRangeProvider({ children }) {
  const [{ start, end }, setRange] = useState(currentWeek());

  function setDateRange(newStart, newEnd) {
    if (newStart && newEnd && newStart <= newEnd) {
      setRange({ start: newStart, end: newEnd });
    }
  }

  function resetToCurrentWeek() {
    setRange(currentWeek());
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
