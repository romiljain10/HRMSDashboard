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
