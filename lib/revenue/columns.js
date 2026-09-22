// Property values should match a BambooHR location name exactly (the same
// names shown in the app's Location filter) — that's what lets revenue
// data join cleanly against labor-cost data for the same property.

export const REVENUE_COLUMNS = [
  { key: "property", label: "Property", type: "string", required: true,
    help: "Must match a location name exactly as it appears in the app's Location filter (e.g. \"Lake Buena Vista\")." },
  { key: "periodStart", label: "Period Start (YYYY-MM-DD)", type: "date", required: true },
  { key: "periodEnd", label: "Period End (YYYY-MM-DD)", type: "date", required: true },
  { key: "occupancyPct", label: "Occupancy % (e.g. 73.25)", type: "percent", required: true,
    help: "Enter as a plain percentage number, e.g. 73.25 for 73.25% — not 0.7325." },
  { key: "adr", label: "ADR ($)", type: "number", required: true },
  { key: "revpar", label: "RevPAR ($)", type: "number", required: true },
  { key: "roomRevenue", label: "Room Revenue ($)", type: "number", required: true },
  { key: "totalRevenue", label: "Total Revenue ($)", type: "number", required: true },
  { key: "bookedRooms", label: "Booked Rooms", type: "number", required: true },
  { key: "notes", label: "Notes (optional)", type: "string", required: false },
];

export const EXAMPLE_ROW = {
  property: "Lake Buena Vista",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  occupancyPct: 73.25,
  adr: 140.15,
  revpar: 110.72,
  roomRevenue: 215562,
  totalRevenue: 226237,
  bookedRooms: 1580,
  notes: "",
};
