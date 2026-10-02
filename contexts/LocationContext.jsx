"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState("All Locations");
  const { user } = useCurrentUser();
  const restrictedProperty = user?.property || null;

  // A property-restricted account's location is locked to that one
  // property — this is a UX convenience (so the dropdown shows the right
  // thing and nobody wonders why other properties are invisible); the
  // actual enforcement happens server-side (see lib/session.js
  // resolveAllowedProperty), so this lock being bypassed somehow
  // wouldn't expose other properties' data regardless.
  useEffect(() => {
    if (restrictedProperty) setLocationState(restrictedProperty);
  }, [restrictedProperty]);

  function setLocation(value) {
    if (restrictedProperty) return; // ignore attempts to change it
    setLocationState(value);
  }

  return (
    <LocationContext.Provider value={{ location, setLocation, isLocationLocked: Boolean(restrictedProperty) }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationFilter() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocationFilter must be used within a LocationProvider");
  }
  return ctx;
}
