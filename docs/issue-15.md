# Issue #15 — Chart & Analytics: Harden Recharts Types, Add Chart Tests, Data Pipeline & Docs

## Design Rationale

The existing analytics components used raw Recharts primitives with `any`-typed callback props, hand-rolled bar charts, and no data-pipeline abstraction. This upgrade introduces:

- **Typed Recharts layer** — `ChartTooltipRenderProps` / `ChartTooltipPayloadEntry` in `lib/types.ts` eliminate every `any` in chart callbacks. `components/ui/chart.tsx` now safely narrows `item.value` before calling `.toLocaleString()`.
- **Data pipeline** (`lib/analytics/chart-data.ts`) — Pure functions (`buildVolumeHistory`, `buildCategoryBreakdown`, `buildTopAssets`, `computeStat`, `formatVolume`) transform `Transaction[]` into chart-ready data with no React dependencies; fully unit-testable.
- **`AnalyticsService`** (`lib/services/analytics.service.ts`) — Extends `BaseService`, wraps pipeline functions, and fulfils the `IAnalyticsService` interface from `lib/types.ts`.
- **REST endpoint** (`app/api/analytics/route.ts`) — `GET /api/analytics?interval=day|week|month|year` returns `AnalyticsResponse`; validates the interval parameter and returns `400` on invalid input.
- **`useAnalytics` hook** (`hooks/useAnalytics.ts`) — Thin React wrapper; manages loading/error state and exposes `setInterval` / `refresh`.
- **`ProjectAnalytics` component** — Migrated from raw `ResponsiveContainer` to `ChartContainer` + typed `ChartConfig`; removed all `any` casts.
- **`AnalyticsContent` component** — Replaced CSS-only bar chart with two live Recharts charts: `LineChart` (7-day volume) and `BarChart` (category breakdown).

## Folders Modified (≥ 6)

| Folder | Changes |
|---|---|
| `lib/` | `types.ts` (chart types), `analytics/chart-data.ts` (new), `services/analytics.service.ts` (new) |
| `app/api/` | `analytics/route.ts` (new) |
| `hooks/` | `useAnalytics.ts` (new) |
| `components/ui/` | `chart.tsx` (type-safe value narrowing) |
| `components/dashboard/` | `project-analytics.tsx` (ChartContainer, typed tooltip) |
| `components/analytics/` | `analytics-content.tsx` (Recharts LineChart + BarChart) |
| `components/app/` | `transaction-list.tsx` (aria-label + data-transaction-count) |
| `tests/` | unit, component, integration, e2e tests |
| `docs/` | `issue-15.md` (this file) |

## API Contract

### `GET /api/analytics`

**Query params**

| Param | Type | Default | Description |
|---|---|---|---|
| `interval` | `'day' \| 'week' \| 'month' \| 'year'` | `'week'` | Bucket granularity |
| `from` | ISO 8601 string | — | Optional range start |
| `to` | ISO 8601 string | — | Optional range end |

**Success response** `200`

```json
{
  "success": true,
  "data": {
    "interval": "week",
    "stats": [
      { "id": "transaction_volume", "title": "Transaction Volume", "value": "$1.2K",
        "numericValue": 1200, "change": "+14%", "changePct": 14, "trend": "up" }
    ],
    "volumeHistory": [
      { "label": "Mon", "value": 1140, "timestamp": "2026-06-16T00:00:00.000Z" }
    ],
    "categoryBreakdown": [
      { "category": "payment", "count": 2, "volume": 300 }
    ],
    "topAssets": [
      { "asset": "XLM", "volume": 77000, "pct": 98.73 }
    ]
  }
}
```

**Error response** `400`

```json
{ "success": false, "error": "Invalid interval. Must be one of: day, week, month, year" }
```

## New TypeScript Types (`lib/types.ts`)

```typescript
type ChartInterval = 'day' | 'week' | 'month' | 'year'
interface ChartDataPoint { label: string; value: number; secondaryValue?: number; timestamp?: string }
interface ChartSeries    { key: string; label: string; color: string; data: ChartDataPoint[] }
type AnalyticsMetricId   = 'transaction_volume' | 'active_wallets' | 'send_count' | 'receive_count' | 'conversion_rate' | 'fee_total'
interface AnalyticsStat  { id: AnalyticsMetricId; title: string; value: string; numericValue: number; change: string; changePct: number; trend: 'up' | 'down' | 'flat' }
interface AnalyticsDashboard { interval: ChartInterval; stats: AnalyticsStat[]; volumeHistory: ChartDataPoint[]; categoryBreakdown: ...; topAssets: ... }
interface ChartTooltipPayloadEntry { value: number; name: string; dataKey: string; color?: string; payload: ChartDataPoint }
interface ChartTooltipRenderProps  { active?: boolean; payload?: ChartTooltipPayloadEntry[]; label?: string }
interface IAnalyticsService { getDashboard(r): Promise<AnalyticsDashboard>; getVolumeHistory(i): ChartDataPoint[]; ... }
```

## Test Instructions

```bash
# Unit — data pipeline + service
npm run test:unit -- --testPathPattern="analytics"

# Component — React Testing Library
npm run test:component -- --testPathPattern="analytics|project-analytics"

# Integration — API route without a browser
npm run test:integration -- --testPathPattern="analytics-api"

# E2E — Playwright (requires dev server on port 3000)
npx playwright test tests/e2e/analytics.spec.ts
```

Expected output: all tests pass, coverage >90% on `lib/analytics/chart-data.ts` and `lib/services/analytics.service.ts`.

## Security Notes

- **No private keys or seeds** appear in any analytics payload — only aggregated statistics.
- The `MERGE_ANALYTICS_URL` secret is consumed exclusively in CI (`merge-analytics` job) and never exposed client-side.
- Testnet vs mainnet: analytics currently operates on mock fixture data; when wired to a live Stellar node, ensure all network requests go through the existing `StellarService` which reads `STELLAR_NETWORK` from the environment (see `docs/issue-28.md`).
- The `/api/analytics` endpoint is read-only and performs no state mutations; no auth guard is required for the current mock implementation, but production deployments should add session validation.

## Rollout / Migration Notes

1. **No breaking changes** — `AnalyticsContent` and `ProjectAnalytics` are drop-in replacements; the old hand-rolled bar chart logic is removed entirely.
2. **Mock data** — `AnalyticsService` reads `MOCK_TRANSACTIONS` from `lib/fixtures/transactions.ts`. Replace `loadTransactions()` with a real DB call when a persistence layer is available.
3. **`useAnalytics` hook** — Defaults to `interval = 'week'`; call `setInterval('month')` to switch granularity.
4. No database migrations required; no environment variables added beyond the existing `MERGE_ANALYTICS_URL`.

## QA Checklist

- [ ] `npm run build` completes with zero TypeScript errors
- [ ] `npm run test:unit` passes for `chart-data` and `analytics.service`
- [ ] `npm run test:component` passes for `analytics-content` and `project-analytics`
- [ ] `npm run test:integration` passes for `analytics-api`
- [ ] `npx playwright test tests/e2e/analytics.spec.ts` passes
- [ ] `GET /api/analytics?interval=week` returns `200` with valid JSON
- [ ] `GET /api/analytics?interval=hour` returns `400`
- [ ] `ProjectAnalytics` card is visible on the home dashboard in a browser
- [ ] `AnalyticsContent` renders both LineChart and BarChart without console errors
- [ ] No `any` types remain in chart component files
- [ ] CI merge-analytics payload includes `15` in the `issues` array
