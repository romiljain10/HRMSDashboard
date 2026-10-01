/**
 * Matches (property, employeeName) from an upload against the live
 * BambooHR employee directory. Exact, case-insensitive, whitespace-
 * trimmed match on full name, scoped to that property (so "Sam" at one
 * hotel doesn't accidentally match "Sam" at another). Returns the
 * matched employee's id, or null with a reason if no confident match
 * was found — callers should surface that as a warning rather than
 * silently attributing the amount to the wrong person or no one.
 */
export function matchEmployeeByName(property, employeeName, directory) {
  const normalize = (s) => String(s || "").trim().toLowerCase();
  const targetName = normalize(employeeName);
  const targetProperty = normalize(property);

  const atProperty = directory.filter((e) => normalize(e.location) === targetProperty);
  const matches = atProperty.filter((e) => normalize(e.name) === targetName);

  if (matches.length === 1) return { employeeId: matches[0].id, matched: true };
  if (matches.length > 1) return { employeeId: null, matched: false, reason: `Multiple employees named "${employeeName}" at ${property} — couldn't tell which one.` };
  if (atProperty.length === 0) return { employeeId: null, matched: false, reason: `No employees found at property "${property}" — check the property name matches exactly.` };
  return { employeeId: null, matched: false, reason: `No employee named "${employeeName}" found at ${property}.` };
}
