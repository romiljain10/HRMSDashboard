# BambooHR Integration Guide

This document covers everything added to wire this dashboard to live BambooHR
data: setup, what maps where, architecture, and how to test it.

## 1. Setup

1. Copy the env template and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
2. Set the three variables in `.env.local`:
   - `BAMBOOHR_SUBDOMAIN` — the `companySubDomain` in `https://companySubDomain.bamboohr.com`
   - `BAMBOOHR_API_KEY` — generate under BambooHR → Account → API Keys. The key
     is used as the HTTP Basic Auth username; the password is the literal
     string `x` (handled automatically in `lib/bamboohr/client.js`).
   - `BAMBOOHR_CACHE_TTL` — seconds to cache server-side responses (default 60).
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000/dashboard`.

The app currently ships with **sandbox placeholder credentials** in
`.env.local` — every page will render correctly and show a red "Retry" banner
with an `AUTH_FAILED` error until real credentials are supplied. That's the
expected, tested failure mode (see §4).

### Required BambooHR permissions / add-ons

- **Core** (always available): Employee Directory, Get Employee, Custom Reports.
- **Time Tracking add-on** (optional): powers live Regular/OT/Holiday hours.
  If not enabled on your account, the app falls back to 0 hours and shows a
  yellow "degraded" banner — it does not error out.
- **Time Off** (usually available on all plans): powers PTO Accrued/Used/Balance.
  Same graceful-degradation behavior if unavailable.

The API key's user must have permission to read the fields above for all
employees (a company admin/API-only user account is recommended, not a
personal login).

## 2. What's live vs. local vs. static

This dashboard turned out to be a **hotel payroll/labor-cost tool**, not a
generic HR directory — several widgets (burden %, fully-loaded rate, hotel
revenue KPIs) have no BambooHR equivalent by design. Boundary:

| Data | Source |
|---|---|
| Employee name, title, department, status, hire date | **Live** — BambooHR Employees Directory / Custom Report |
| Base pay rate | **Live** — BambooHR `payRate` field |
| Regular / OT / Holiday hours | **Live** if Time Tracking add-on is enabled, else 0 (degraded banner) |
| PTO Accrued / Used / Balance | **Live** — BambooHR Time Off Balance, else 0 (degraded banner) |
| Burden %, fully-loaded rate, weekly total cost | **Local** — `lib/payroll/config.js`; BambooHR has no concept of employer burden or fully-loaded labor cost |
| Payroll approval status (Pending/Approved) | **Local** — defaults to `"Pending"`; BambooHR has no payroll-approval workflow of its own |
| Hotel revenue KPIs (RevPAR, ADR, Occupancy %, GOP %) | **Static** — belongs to a PMS/revenue-management system, not HR/BambooHR |
| 13-week historical payroll trend | **Static** — no BambooHR payroll-history endpoint is used here |

## 3. BambooHR endpoints used, and where

| Endpoint | Used in | Notes |
|---|---|---|
| `POST /v1/reports/custom` | `services/bamboo/payrollService.js` → `fetchDirectoryWithCompensation()` | One request for the whole roster (employeeNumber, name, title, department, status, hireDate, payRate) instead of N+1 per-employee calls. Feeds Employees, Departments, Dashboard, Payroll pages. |
| `GET /v1/employees/directory` | `services/bamboo/employeeService.js` → `getEmployeeDirectory()` | Standalone directory service, exposed at `/api/bamboo/directory` (not currently linked from any page — available for future widgets). |
| `GET /v1/employees/{id}` | `services/bamboo/employeeService.js` → `getEmployeeById()` | Available for a richer employee-detail fetch; the `[id]` page currently reads from the shared payroll dataset instead for consistency with the list page. |
| `GET /v1/time_tracking/timesheet_entries` | `services/bamboo/payrollService.js` → `fetchWeeklyHours()` | Regular/OT/Holiday hours for the current pay period. Feeds Employees, Payroll, Dashboard, Reports → Payroll Hours (current period section). |
| `GET /v1/employees/{id}/time_off/calculator` | `services/bamboo/timeOffService.js` → `fetchAllPtoBalances()` | One call per employee (bounded to 5 concurrent), summed across time-off types. Feeds Reports → PTO. |

All requests go through `lib/bamboohr/client.js`, which handles:
- HTTP Basic Auth (API key + literal `x`)
- 10s timeout per request
- Retry with exponential backoff on network errors, `429`, and `5xx` (up to 3 retries, respects `Retry-After`)
- Normalized `BambooHRError` with a stable `.code` (`AUTH_FAILED`, `RATE_LIMITED`, `NOT_FOUND`, `TIMEOUT`, `NETWORK_ERROR`, `MISSING_CREDENTIALS`, etc.)

Nothing calls BambooHR from the browser — the API key never leaves the server.
Client components call our own `/api/bamboo/*` routes, which call BambooHR.

## 4. Architecture

```
app/api/bamboo/
  directory/route.js     -- GET employee directory + KPIs
  payroll/route.js       -- GET combined live payroll dataset

services/bamboo/
  employeeService.js      -- directory, single employee, KPI aggregation
  payrollService.js       -- combines directory+compensation+hours+PTO,
                              computes department rollups & totals
  timeOffService.js        -- PTO balance fetch, bounded concurrency

lib/bamboohr/
  client.js               -- auth, retries, timeout, error normalization
  cache.js                 -- short-TTL in-memory response cache
  errors.js                -- BambooHRError -> HTTP response mapping

lib/payroll/
  config.js                -- LOCAL business rules (burden %, dept mapping) —
                              explicitly not sourced from BambooHR

hooks/
  usePayrollDataset.js      -- client-side fetch + loading/error/retry state

components/
  DataStateBanner.jsx        -- shared loading / error+retry / degraded UI
```

Every page that needs live data calls `usePayrollDataset()`, which hits
`GET /api/bamboo/payroll` once per page load (cached server-side for
`BAMBOOHR_CACHE_TTL` seconds so repeated navigation doesn't re-hit BambooHR).

## 5. Testing checklist

**Authentication**
- [ ] Valid credentials in `.env.local` → dashboard loads with real employee names/departments, no banners.
- [ ] Invalid/expired API key → every live page shows the red "Retry" banner with an auth error; clicking Retry re-attempts the fetch.
- [ ] `.env.local` missing entirely → same graceful error (`MISSING_CREDENTIALS`), not a server crash.

**Employee data**
- [ ] Employees page lists everyone from the BambooHR account; search/filter/sort/pagination all work against live data.
- [ ] Employee detail page (`/employees/{id}`) shows the same person's data as the list row; unknown id shows "Employee not found."
- [ ] Departments page totals reconcile with the sum shown on the Payroll page (both derive from the same dataset).

**Hours (Time Tracking)**
- [ ] With Time Tracking enabled and data present: Employees/Payroll/Dashboard show non-zero hours matching BambooHR.
- [ ] With Time Tracking disabled/unavailable: pages still load, hours show 0, yellow "degraded" banner appears — no crash.

**PTO**
- [ ] Reports → PTO shows accrued/used/balance per employee matching BambooHR's Time Off balances.
- [ ] Low-balance flag (<8h) highlights correctly.
- [ ] Time Off unavailable → 0 balances + yellow degraded banner, not a crash.

**Reports**
- [ ] Reports → Payroll Hours "Current Pay Period Detail" table matches the live employee hours shown elsewhere.
- [ ] Historical 13-period trend chart still renders (static, unaffected by API state).

**Error scenarios**
- [ ] Simulate a slow/hanging BambooHR response → request times out at 10s rather than hanging the page.
- [ ] Simulate a `429` from BambooHR → client retries with backoff instead of failing immediately.
- [ ] Simulate a `5xx` from BambooHR → same retry behavior; after 3 attempts, shows the red banner.
- [ ] Network fully down → red banner with a network-error message, Retry button works once connectivity returns.

**Regression / non-goals**
- [ ] Hotel revenue KPIs on the Dashboard (RevPAR, ADR, Occupancy, GOP) are unchanged from before this integration (they're intentionally static).
- [ ] No BambooHR API key or request appears in any browser network tab — all calls go to `/api/bamboo/*` on the same origin.
- [ ] Existing layout, colors, and navigation are pixel-identical to before the integration.

## 6. Known follow-ups

- `lib/payroll/config.js`'s `DEPARTMENT_GROUP_MAP` only covers this hotel's
  10 department names — extend it once you see the real BambooHR department list.
- PTO and hours are fetched per-employee (bounded concurrency). Fine at this
  roster size; for a much larger company, switch to a scheduled sync + longer
  cache instead of fetching on every page load.
- Payroll approval status is a local placeholder (`"Pending"` for everyone).
  If you want real approve/reject workflow, that needs its own local data
  store (or a BambooHR custom field) — BambooHR's API has no payroll
  sign-off concept to hook into.
- Endpoint field names for `time_tracking/timesheet_entries` and
  `time_off/calculator` were implemented from BambooHR's documented patterns;
  worth a quick verification pass against a live account in case any field
  name needs adjusting.
