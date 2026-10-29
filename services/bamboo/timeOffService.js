import { bambooGet, BambooHRError } from "@/lib/bamboohr/client";

/**
 * Fetches PTO balance for a single employee as of a given date.
 * BambooHR's v1 API has no bulk "all balances" endpoint, so this is
 * inherently one request per employee — call fetchAllPtoBalances below
 * to fan these out with limited concurrency instead of a naive loop.
 */
async function fetchEmployeeTimeOffBalance(employeeId, asOfDate) {
  const data = await bambooGet(`/employees/${employeeId}/time_off/calculator`, {
    end: asOfDate,
  });

  // Response is an array of time-off-type balances; sum across types so the
  // UI (which shows one PTO figure per employee) gets a single number, same
  // as the previous static dataset.
  const list = Array.isArray(data) ? data : [];
  const totals = list.reduce(
    (acc, t) => {
      acc.accrued += Number(t.balance ?? 0) + Number(t.used ?? 0);
      acc.used += Number(t.used ?? 0);
      acc.balance += Number(t.balance ?? 0);
      return acc;
    },
    { accrued: 0, used: 0, balance: 0 }
  );

  return {
    ptoAccrued: Math.round(totals.accrued * 100) / 100,
    ptoUsed: Math.round(totals.used * 100) / 100,
    ptoBalance: Math.round(totals.balance * 100) / 100,
  };
}

const CONCURRENCY = 5;

/**
 * Fetches PTO balances for many employees with bounded concurrency (so we
 * don't fire 24+ simultaneous requests and trip BambooHR's rate limit).
 * Falls back to zeroed balances per-employee on individual failures, and
 * reports whether the fetch was fully live.
 */
export async function fetchAllPtoBalances(employeeIds, asOfDate) {
  const results = new Map();
  let anyFailure = false;
  let queue = [...employeeIds];

  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      try {
        const balance = await fetchEmployeeTimeOffBalance(id, asOfDate);
        results.set(String(id), balance);
      } catch (err) {
        anyFailure = true;
        results.set(String(id), { ptoAccrued: 0, ptoUsed: 0, ptoBalance: 0 });
        if (!(err instanceof BambooHRError)) throw err;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return { balances: results, live: !anyFailure };
}

/**
 * PTO actually taken inside [startISO, endISO] — one company-wide request
 * (approved requests only) instead of one call per employee. Returns a Map
 * of employeeId -> hours, or null if the call failed (caller falls back to
 * the calculator's "used" figure).
 */
export async function fetchPtoUsedInPeriod(startISO, endISO) {
  try {
    const data = await bambooGet("/time_off/requests/", { start: startISO, end: endISO, status: "approved" });
    const list = Array.isArray(data) ? data : [];
    const hoursByEmployee = new Map();
    for (const r of list) {
      const id = String(r.employeeId ?? "");
      if (!id) continue;
      const unit = String(r.amount?.unit ?? "hours").toLowerCase();
      const perUnit = unit.startsWith("day") ? 8 : 1; // days -> 8h standard day
      let hours = 0;
      if (r.dates && typeof r.dates === "object") {
        // per-day breakdown: only count days inside the selected period
        for (const [day, amt] of Object.entries(r.dates)) {
          if (day >= startISO && day <= endISO) hours += Number(amt || 0) * perUnit;
        }
      } else if (r.start >= startISO && r.end <= endISO) {
        hours = Number(r.amount?.amount || 0) * perUnit;
      }
      if (hours > 0) hoursByEmployee.set(id, (hoursByEmployee.get(id) || 0) + hours);
    }
    return hoursByEmployee;
  } catch {
    return null;
  }
}
