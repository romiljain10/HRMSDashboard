import "./globals.css";
import { LocationProvider } from "@/contexts/LocationContext";

export const metadata = {
  title: "HR Manager – Payroll & HR Management System",
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
        <LocationProvider>{children}</LocationProvider>
      </body>
    </html>
  );
}
