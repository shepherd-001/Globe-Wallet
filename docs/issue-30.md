# Issue #30 — Dashboard Service Integration & Testing Strategy

## Design Rationale

Globe Wallet previously maintained **two parallel data paths**:

1. **Legacy static layer** — `lib/finance-data.ts` imported directly by mobile UI components.
2. **Enterprise service layer** — `WalletService`, `FiatService`, hooks, and API routes used on `/finance-demo`.

Issue #30 closes that gap by wiring the **production home dashboard** (`app/page.tsx`) to the service container via `FinanceServicesProvider`, while preserving the mobile-first UI in `components/app/*`.

### Key decisions

| Decision | Rationale |
|----------|-----------|
| Root-level `FinanceServicesProvider` in `app/layout.tsx` | Ensures all routes share injectable, testable services without duplicating providers per page. |
| Unified `Transaction` model with display metadata | Service types (`send`/`receive`) stay canonical; UI direction (`in`/`out`) is derived in `lib/transaction-utils.ts`. |
| `GET /api/transactions` | Enables integration tests and future clients without coupling UI to mock DB internals. |
| `lib/transaction-utils.ts` for fees & filters | Keeps business rules unit-testable and out of React components (>90% coverage target for changed modules). |

---

## API Contracts

### `GET /api/transactions`

Returns transaction history from `WalletService.getTransactionHistory()` with optional filters.

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `type` | `in` \| `out` | Filter by UI direction (mapped from `receive` / `send`+`withdraw`) |
| `category` | `transfer` \| `airtime` \| `bills` \| `savings` \| `card` \| `deposit` | Filter by category |
| `limit` | number | Max rows returned |

**Success (`200`)**

```json
{
  "success": true,
  "data": [
    {
      "id": "t1",
      "type": "receive",
      "amount": 75000,
      "asset": "XLM",
      "address": "GDXSPAY...",
      "date": "Today, 09:42",
      "status": "completed",
      "name": "Adaeze Okoro",
      "detail": "Transfer from @adaeze",
      "category": "transfer",
      "currency": "NGN"
    }
  ]
}
```

**Error (`500`)**

```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Existing: `POST /api/send`

See [issue-23.md](./issue-23.md) for the send flow contract. Issue #30 adds no breaking changes.

### Fee calculation (client-side estimate)

```typescript
import { calculateNetworkFee, formatFeeDisplay } from '@/lib/transaction-utils'

const fee = calculateNetworkFee(amount, 'XLM') // 0.00001 for positive amounts
formatFeeDisplay(fee) // "0.00001 XLM"
```

---

## Testing Strategy

### Coverage goals

| Layer | Target | Scope |
|-------|--------|-------|
| Unit (business logic) | **>90%** | `lib/transaction-utils.ts`, `hooks/useTransactions.ts`, services touched by this issue |
| Component (RTL) | Critical paths | Balance card, transaction list, accessible inputs |
| Integration | API + hooks | `/api/transactions`, service container wiring |
| E2E (Playwright) | Happy + failure | Home dashboard load, send navigation, API abort resilience |

### Commands

```bash
# Full Jest suite (unit + component + integration + property)
npm test

# By layer
npm run test:unit
npm run test:component
npm run test:integration

# Coverage report (90% global threshold on lib/, hooks/, components/)
npm run test:coverage

# E2E — all browsers
npm run test:e2e

# E2E — issue #30 dashboard specs only
npm run test:e2e -- --grep "Issue #30"

# E2E — send flow (#23)
npm run test:e2e -- --grep "Send Flow"

# Lint + production build (also run in CI)
npm run lint
npm run build
```

### Test matrix (issue #30)

| Type | File | Cases |
|------|------|-------|
| Unit | `tests/unit/transaction-utils.test.ts` | Direction mapping, invalid fee inputs, filter helpers |
| Unit | `tests/unit/hooks/useTransactions.test.ts` | Direction filter, formatting, category totals |
| Component | `tests/component/app-transaction-list.test.tsx` | Service-driven list, a11y label |
| Integration | `tests/integration/transactions-api.test.ts` | GET success, `type`/`category`/`limit` filters |
| E2E | `tests/e2e/issue-30-dashboard.spec.ts` | Happy path home dashboard; API failure does not crash |
| E2E | `tests/e2e/dashboard.spec.ts` | Portfolio overview → send navigation; invalid address |

---

## Rollout / Migration Notes

1. **No database migration required** — mock DB (`lib/db/mock-db.ts`) seeds from `finance-data.ts`.
2. **Component imports** — Pages should consume hooks (`useBalances`, `useTransactions`, `useWallets`) instead of importing `finance-data` directly for runtime data. Static seed data remains for Storybook-style fixtures.
3. **Breaking change: none for public API routes** except additive `GET /api/transactions`.
4. **Feature flag (optional)** — To roll back, remove `FinanceServicesProvider` from layout and restore static imports in `components/app/*` (not recommended).

---

## Security & Privacy

- **Never commit private keys, mnemonics, or production Horizon secrets.** Use `.env.local` for network URLs only.
- **Testnet vs mainnet** — Default docs and CI use Stellar testnet (`NEXT_PUBLIC_STELLAR_NETWORK=testnet`). Mainnet requires explicit env configuration and additional audit.
- **Analytics** — `MERGE_ANALYTICS_URL` is supplied via GitHub repository secrets; the workflow POST contains no user PII.
- **Encrypted keys in mock DB** — `mock-db.ts` stores placeholder `encrypted_private_key` values for schema realism only; never use these in production.

---

## Definition of Done (Issue #30)

- [x] Code compiles without TypeScript errors
- [x] Unit, component, integration, and E2E tests pass locally and in CI
- [x] `docs/issue-30.md` added and linked from `README.md`
- [x] CI runs lint, build, tests, coverage; merge analytics POST uses `issue: 30`
- [x] At least six folders touched: `app`, `components/app`, `components/ui`, `components/dashboard`, `lib`, `hooks`, `tests`, `docs`

---

## Changelog (human-readable)

**Added**

- `GET /api/transactions` with filter query params
- `lib/transaction-utils.ts` — direction mapping, fee helpers, filters
- `useWallets()` hook export
- Service-wired `BalanceCard` and `TransactionList` on home dashboard
- Portfolio `StatsCards` section (desktop) with `data-testid="dashboard-overview"`
- Accessible `Input` error message prop
- Test suites and E2E specs for issue #30
- This document and README testing strategy section

**Changed**

- `Transaction` and `Wallet` types extended with display metadata
- `FinanceServicesProvider` mounted at app root
- CI merge analytics tagged as issue **30**; lint/build/coverage steps added

**Fixed**

- Type drift between hooks and `Transaction` model
- Broken `useWallets` import in dashboard stats cards
- E2E specs pointing at non-existent `/dashboard` route

---

## QA Checklist

Use this in PR review and manual QA:

- [ ] Home page loads balance card with live wallet data from services
- [ ] Recent activity list shows seeded transactions with correct +/- formatting
- [ ] Currency tabs on balance card switch displayed wallet
- [ ] Hide/show balance toggle masks amounts
- [ ] Desktop portfolio overview (`StatsCards`) renders at ≥768px viewport
- [ ] Quick action **Send** navigates to send form
- [ ] Invalid Stellar address shows inline error on send review
- [ ] `GET /api/transactions?type=in&limit=5` returns filtered JSON
- [ ] `npm run test:coverage` meets 90% threshold on changed modules
- [ ] No secrets in diff or docs
