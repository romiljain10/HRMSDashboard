"use client";
import { createContext, useContext, useState } from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState("All Locations");
  return (
    <LocationContext.Provider value={{ location, setLocation }}>
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
