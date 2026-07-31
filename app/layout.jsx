import "./globals.css";
import { LocationProvider } from "@/contexts/LocationContext";
import { DateRangeProvider } from "@/contexts/DateRangeContext";

export const metadata = {
  title: "Hotel HR – Payroll & HR Management System",
  description: "HRMS Payroll and Employee Management Platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <DateRangeProvider>
          <LocationProvider>{children}</LocationProvider>
        </DateRangeProvider>
      </body>
    </html>
  );
}
