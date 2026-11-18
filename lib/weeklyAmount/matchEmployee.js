/**
 * Matches (property, employeeName) from an upload against the live
 * BambooHR employee directory, scoped to that property so "Sam" at one
 * hotel doesn't match "Sam" at another. The property may be written
 * loosely ("Red Lion" for BambooHR's "Red Lion - Montana"): it resolves to
 * the single location it unambiguously refers to, and the canonical
 * location name is returned so the saved row lines up with the payroll
 * data. Returns the employee id, or null with a reason when there is no
 * confident match — callers surface that as a warning.
 */
const normalize = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

export function resolveProperty(property, directory) {
  const target = normalize(property);
  const locations = [...new Set(directory.map((e) => e.location).filter(Boolean))];
  const exact = locations.find((l) => normalize(l) === target);
  if (exact) return exact;
  const loose = locations.filter((l) => {
    const n = normalize(l);
    return target && (n.startsWith(target + " ") || n.startsWith(target + "-") || n.includes(target));
  });
  return loose.length === 1 ? loose[0] : null;
}

export function matchEmployeeByName(property, employeeName, directory) {
  const targetName = normalize(employeeName);
  const canonical = resolveProperty(property, directory);
  const atProperty = canonical ? directory.filter((e) => e.location === canonical) : [];
  const matches = atProperty.filter((e) => normalize(e.name) === targetName);

  if (matches.length === 1) return { employeeId: matches[0].id, matched: true, property: canonical };
  if (matches.length > 1) return { employeeId: null, matched: false, property: canonical, reason: `Multiple employees named "${employeeName}" at ${property} — couldn't tell which one.` };
  if (!canonical) return { employeeId: null, matched: false, property: null, reason: `No single location matches "${property}" — check the property name against the Location filter.` };
  return { employeeId: null, matched: false, property: canonical, reason: `No employee named "${employeeName}" found at ${canonical}.` };
}
