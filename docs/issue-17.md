# Issue #17 — Chart Components: Replace Loose any/unknown Typings with Strict Recharts Types

## Design Rationale

The `ProjectAnalytics` component and the shared `ChartContainer` / tooltip utilities in `components/ui/chart.tsx` previously used `any` or structurally-opaque `unknown` parameters wherever Recharts injected callback payloads. This made the chart layer invisible to TypeScript's type checker: mistyped data access (`payload[0].payload.label`) was unverified at compile time and would silently break if the data shape changed.

This upgrade introduces:
- **Named interfaces** for every Recharts callback shape (tooltip payload, legend payload, API response).
- A **`RechartsPayloadItem`** structural interface replacing `unknown` in the internal `getPayloadConfigFromPayload` helper.
- A **typed API route** (`/api/analytics`) that returns `ChartAnalyticsApiResponse`, so the data contract is shared between server and client.
- A **`useChartData`** hook that fetches from the API and exposes typed state to any consumer.

### Key design decisions

| Decision | Rationale |
|---|---|
| Define types in `lib/types.ts`, not inline | Keeps domain types co-located; avoids import cycles. |
| `ActivityTooltipProps` instead of `TooltipProps<number, string>` | Recharts v2 generic `TooltipProps` carries broad value types; a narrower local interface is more ergonomic and survives a v3 migration. |
| `RechartsPayloadItem extends Record<string, unknown>` | Satisfies both Tooltip and Legend payload shapes from recharts v2 without importing internal package types. |
| `/api/analytics` returns `ChartDailyDataPoint[]` | Single source of truth; dashboard can switch from static to live data without changing component types. |

---

## API Contracts

### `GET /api/analytics`

**Query parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `period` | `"week" \| "month" \| "year"` | No (defaults `week`) | Aggregation period |

**Success response — 200**

```json
{
  "success": true,
  "data": {
    "period": "week",
    "points": [
      { "day": "S", "value": 45, "label": "Sunday" },
      { "day": "M", "value": 75, "label": "Monday" }
    ],
    "average": 62,
    "peak": 92
  }
}
```

**Error response — 400**

```json
{
  "success": false,
  "error": "Invalid period \"quarterly\". Must be week | month | year."
}
```

---

## TypeScript Interfaces Added (`lib/types.ts`)

```typescript
ChartDailyDataPoint       // { day, value, label } — one bar in the chart
ChartTooltipEntry         // typed Recharts tooltip payload item
ActivityTooltipProps      // props received by CustomTooltip in project-analytics.tsx
ChartAnalyticsEntry       // generic analytics data point
ChartSeriesConfig         // per-series color/key configuration
ChartAnalyticsApiResponse // GET /api/analytics response envelope
```

---

## Files Changed

| File | Change |
|---|---|
| `lib/types.ts` | Added 6 chart-specific interfaces |
| `components/dashboard/project-analytics.tsx` | Replaced `any` with `ActivityTooltipProps`; typed `chartData` and `barColors` |
| `components/ui/chart.tsx` | Replaced `payload: unknown` with `RechartsPayloadItem` structural interface |
| `hooks/useChartData.ts` | New hook — typed fetch, state, and formatValue |
| `app/api/analytics/route.ts` | New API route returning `ChartAnalyticsApiResponse` |
| `tests/unit/chart-types.test.ts` | 30 + unit tests covering types, helpers, and edge cases |
| `tests/component/project-analytics.test.tsx` | Component render, stat values, accessibility |
| `tests/integration/chart-api.test.ts` | API success/error/shape/Content-Type coverage |
| `tests/e2e/chart-flow.spec.ts` | Playwright happy-path and failure-path |
| `.github/workflows/ci.yml` | Added issue #17 E2E step and updated analytics payload |

---

## Test Instructions

```bash
# Unit tests (chart type helpers)
npm run test:unit -- --testPathPattern=chart-types

# Component tests (ProjectAnalytics render)
npm run test:component -- --testPathPattern=project-analytics

# Integration tests (API route)
npm run test:integration -- --testPathPattern=chart-api

# E2E tests (Playwright)
npm run test:e2e -- --grep "Issue #17"

# Full coverage run
npm run test:coverage
```

---

## Rollout / Migration Notes

1. **Static → live data**: The `useChartData` hook is drop-in ready. Replace the static `chartData` array in `ProjectAnalytics` with `const { data, fetch } = useChartData()` and call `fetch()` in `useEffect`.
2. **Recharts v3 migration**: The `ActivityTooltipProps` and `RechartsPayloadItem` interfaces are intentionally decoupled from recharts internal type paths, so upgrading recharts will not require re-typing the component layer.
3. **Month / Year periods**: The API currently returns the same weekly fixture for all periods. Swap the `WEEKLY_DATA` constant with real aggregation logic when a data source is available; the type contract is already in place.

---

## Security Notes

- No private keys, mnemonics, or secrets appear in chart data or API responses.
- `MERGE_ANALYTICS_URL` is consumed via GitHub Actions secrets, never hardcoded.
- All data returned from `/api/analytics` is read-only, unauthenticated, and contains no PII.
- For testnet vs mainnet considerations see [docs/issue-28.md](issue-28.md).

---

## QA Checklist

- [ ] `npm run build` exits 0 (no TypeScript errors)
- [ ] `npm run test:unit` passes for `chart-types.test.ts`
- [ ] `npm run test:component` passes for `project-analytics.test.tsx`
- [ ] `npm run test:integration` passes for `chart-api.test.ts`
- [ ] `npm run test:e2e -- --grep "Issue #17"` passes
- [ ] Dashboard loads and shows "Project Analytics" card with correct Average (62%) and Peak (92%)
- [ ] `GET /api/analytics?period=week` returns 200 with 7 points
- [ ] `GET /api/analytics?period=quarterly` returns 400 with descriptive error
- [ ] No `any` annotations remain in `components/dashboard/project-analytics.tsx`
- [ ] No `any` annotations remain in `components/ui/chart.tsx`
