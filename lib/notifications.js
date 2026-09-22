const HIGH_OT_THRESHOLD = 8; // hours/week

export function buildNotifications(data, { revenue, revenueLoading, tipsEntered, tipsLoading, canManageData, location } = {}) {
  if (!data) return [];
  const employees = data.employees ?? [];
  const notifications = [];

  const pending = employees.filter((e) => e.approvalStatus === "Pending").length;
  if (pending > 0) {
    notifications.push({
      id: "pending-approvals",
      severity: "warning",
      message: `${pending} employee${pending > 1 ? "s" : ""} pending payroll approval`,
      href: "/payroll",
    });
  }

  const missingHours = employees.filter(
    (e) => e.status === "Active" && e.regularHours + e.otHours + e.holidayHours === 0
  ).length;
  if (missingHours > 0) {
    notifications.push({
      id: "missing-hours",
      severity: "warning",
      message: `${missingHours} active employee${missingHours > 1 ? "s" : ""} with no hours logged this period`,
      href: "/reports/payroll-hours",
    });
  }

  const highOt = employees.filter((e) => e.otHours > HIGH_OT_THRESHOLD).length;
  if (highOt > 0) {
    notifications.push({
      id: "high-ot",
      severity: "alert",
      message: `${highOt} employee${highOt > 1 ? "s" : ""} with over ${HIGH_OT_THRESHOLD} OT hours this period`,
      href: "/reports/payroll-hours",
    });
  }

  if (data.meta?.hoursLive === false) {
    notifications.push({
      id: "hours-degraded",
      severity: "info",
      message: "Live Time Tracking data is currently unavailable from BambooHR",
      href: "/payroll",
    });
  }

  if (data.meta?.ptoLive === false) {
    notifications.push({
      id: "pto-degraded",
      severity: "info",
      message: "Live PTO balances are currently unavailable from BambooHR",
      href: "/reports/pto",
    });
  }

  // Revenue/tips reminders only matter to people who can actually do
  // something about them, and only for a specific property (not
  // "All Locations", where "missing" doesn't mean anything actionable).
  if (canManageData && location && location !== "All Locations") {
    if (!revenueLoading && !revenue) {
      notifications.push({
        id: "revenue-missing",
        severity: "info",
        message: `No revenue data uploaded yet for ${location}`,
        href: "/revenue",
      });
    }
    if (!tipsLoading && !tipsEntered) {
      notifications.push({
        id: "tips-missing",
        severity: "info",
        message: `Tips not entered yet for ${location} this week`,
        href: "/revenue",
      });
    }
  }

  return notifications;
}
