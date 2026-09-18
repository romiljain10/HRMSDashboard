"use client";
import { usePayrollDataset } from "@/hooks/usePayrollDataset";
import { useLocationFilter } from "@/contexts/LocationContext";
import {
  buildDepartmentTotals,
  buildBurdenByDepartment,
  buildCurrentPeriodTotals,
  buildDepartmentGroups,
} from "@/lib/payroll/aggregates";
import { round2 } from "@/lib/payroll/config";

export function useFilteredPayrollDataset() {
  const base = usePayrollDataset();
  const { location, setLocation } = useLocationFilter();

  const allEmployees = base.data?.employees ?? [];

  const locations = ["All Locations", ...new Set(allEmployees.map((e) => e.location).filter(Boolean))].sort(
    (a, b) => (a === "All Locations" ? -1 : b === "All Locations" ? 1 : a.localeCompare(b))
  );

  const employees =
    location === "All Locations" ? allEmployees : allEmployees.filter((e) => e.location === location);

  const data = base.data
    ? {
        ...base.data,
        employees,
        departmentTotals: buildDepartmentTotals(employees),
        burdenByDepartment: buildBurdenByDepartment(employees),
        departmentGroups: buildDepartmentGroups(employees),
        grandTotal: round2(employees.reduce((sum, e) => sum + e.totalCost + (e.ptoCost || 0), 0)),
        currentPeriodTotals: buildCurrentPeriodTotals(employees),
      }
    : null;

  return { ...base, data, locations, location, setLocation };
}
