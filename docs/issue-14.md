# Issue #14 — Mock Centralization

## Overview

This document describes the centralized fixture/data service architecture implemented for Globe Wallet. The goal is to provide a single source of truth for all mock data used in testing, development, and API route responses.

## Design Rationale

### Problem
Before Issue #14, mock data was scattered across multiple locations:
- `lib/finance-data.ts` contained seed data for wallets, transactions, assets, contacts, rates, etc.
- `lib/db/mock-db.ts` had its own initialization with duplicate data
- API routes (`app/api/wallet/balances/route.ts`, `app/api/wallet/transactions/route.ts`, etc.) hardcoded inline mock arrays
- Test files duplicated mock data creation logic
- Formatting helpers (`formatMoney`, `formatCrypto`) were mixed into the data file

This led to:
- Inconsistent mock data between routes and tests
- Duplicated maintenance effort
- No standardized way to generate mock data for edge cases
- Difficulty tracking which mock shapes were canonical

### Solution
A centralized `lib/fixtures/` module that:
1. **Is the single source of truth** for all mock domain data
2. **Provides a FixtureFactory** with both static (golden) data and dynamic factory methods
3. **Is consumed by all API routes** to eliminate inline mock arrays
4. **Is used by tests** via factory methods for reproducible, typed test data
5. **Keeps formatting separate** — formatting lives in `lib/helpers/format.ts`

## Architecture

```
lib/fixtures/
├── index.ts          # Re-exports all fixtures + FixtureFactory
├── factory.ts        # FixtureFactory with static accessors + dynamic factory methods
├── balances.ts       # MOCK_BALANCES (3 entries: XLM, USDC, USDT)
├── transactions.ts   # MOCK_TRANSACTIONS (4 entries) + MOCK_TRANSACTIONS_COMPACT (2 entries)
├── wallets.ts        # MOCK_WALLETS (3 entries: NGN, USD, GBP)
├── assets.ts         # MOCK_CRYPTO_ASSETS (3 entries: XLM, USDC, USDT)
├── contacts.ts       # MOCK_CONTACTS (2 entries)
├── rates.ts          # MOCK_CONVERSION_RATES, MOCK_SIMPLE_RATES
├── stellar.ts        # TEST_STELLAR_ADDRESS, MOCK_STELLAR_ACCOUNT
├── savings.ts        # MOCK_SAVINGS_GOALS (3 entries)
└── cards.ts          # MOCK_PAYMENT_CARDS (2 entries)
```

### FixtureFactory API

#### Static Accessors (returns immutable copies)
| Method | Returns | Description |
|--------|---------|-------------|
| `getBalances()` | `Balance[]` | 3 pre-defined balances |
| `getTransactions()` | `Transaction[]` | 4 detailed transactions |
| `getTransactionsCompact()` | `Transaction[]` | 2 compact transactions |
| `getWallets()` | `Wallet[]` | 3 fiat wallets |
| `getCryptoAssets()` | `CryptoAsset[]` | 3 crypto assets |
| `getContacts()` | `Contact[]` | 2 contacts |
| `getSavingsGoals()` | `SavingsGoal[]` | 3 savings goals |
| `getPaymentCards()` | `PaymentCard[]` | 2 payment cards |
| `getConversionRates()` | `Record` | 6x6 conversion matrix |
| `getSimpleRates()` | `Record` | 6 simple rate entries |
| `getStellarAccount()` | `StellarAccount` | Mock Stellar account |
| `getTestStellarAddress()` | `string` | Canonical test address |

#### Dynamic Factory Methods (accepts Partial<T> overrides)
| Method | Returns | Description |
|--------|---------|-------------|
| `createBalance(overrides?)` | `Balance` | Randomized or overridden balance |
| `createTransaction(overrides?)` | `Transaction` | Randomized or overridden transaction |
| `createWallet(overrides?)` | `Wallet` | Randomized or overridden wallet |
| `createContact(overrides?)` | `Contact` | Randomized or overridden contact |
| `createSavingsGoal(overrides?)` | `SavingsGoal` | Randomized or overridden goal |
| `createPaymentCard(overrides?)` | `PaymentCard` | Randomized or overridden card |
| `createPortfolio()` | Full portfolio object | Complete mock portfolio |
| `resetCounter()` | `void` | Reset ID counter for reproducibility |

## API Contracts

### Endpoints updated to use centralized fixtures

| Endpoint | Method | Previous Source | New Source |
|----------|--------|----------------|------------|
| `/api/wallet/balances` | GET | Inline `MOCK_BALANCES` | `FixtureFactory.getBalances()` |
| `/api/wallet/transactions` | GET | Inline `MOCK_TRANSACTIONS` | `FixtureFactory.getTransactions()` |
| `/api/rates` | GET | Inline `MOCK_RATES` | `FixtureFactory.getSimpleRates()` |
| `/api/wallet/send` | POST | Hardcoded hash logic | Uses `TEST_STELLAR_ADDRESS` from fixtures |

### Service layer updates

`WalletService` now imports from `@/lib/fixtures` instead of `@/lib/finance-data`:
- `getAccountInfo()` uses `MOCK_STELLAR_ACCOUNT`
- `getBalance()` uses `MOCK_CRYPTO_ASSETS`
- `shortenKey()` delegates to `formatAddress()` from `lib/helpers/format`

## Component Test-Friendly Props

Components were updated with accessibility attributes and test IDs:

- `BalanceCard`: `data-testid="balance-card"`, toggle button with `aria-label`
- `QuickActions`: `data-testid="quick-actions"`, individual `data-testid` per action
- `TransactionList`: `data-testid="transaction-list"`, empty state handling
- `SendForm`: `aria-label="Send payment form"`, `data-testid` on all inputs
- `BottomNav`: `data-testid="bottom-nav"`, `role="navigation"` with `aria-label`
- `WalletErrorAlert`: `role="alert"`, `aria-live="assertive"`, retry button

## Test Instructions

### Running Tests

```bash
# Unit tests for fixture modules
npm run test:unit -- --testPathPattern="tests/unit/fixtures"

# Component tests
npm run test:component -- --testPathPattern="balance-card|transaction-list|quick-actions"

# Integration tests (API routes)
npm run test:integration -- --testPathPattern="fixture-integration"

# E2E tests (Playwright)
npm run test:e2e -- --grep "Issue #14"

# Full suite
npm test
```

### Expected Coverage

The following coverage thresholds are enforced via `jest.config.js`:

| Module | Target |
|--------|--------|
| `lib/fixtures/**` | >90% |
| `lib/services/wallet.service.ts` | branches 85%, functions 80%, lines 85%, statements 85% |
| `app/api/wallet/**` | >75% |

### Test Matrix

| Test Type | File | Scope |
|-----------|------|-------|
| Unit | `tests/unit/fixtures/fixtures.test.ts` | All fixture data shapes, values, constants |
| Unit | `tests/unit/fixtures/factory.test.ts` | FixtureFactory API, edge cases, overrides |
| Component | `tests/component/balance-card.test.tsx` | BalanceCard rendering, tabs, visibility toggle, accessibility |
| Component | `tests/component/transaction-list.test.tsx` | Transaction loading, empty state, limit prop |
| Component | `tests/component/quick-actions.test.tsx` | QuickActions rendering, links |
| Integration | `tests/integration/fixture-integration.test.ts` | API route responses match fixtures |
| E2E | `tests/e2e/mock-centralization.spec.ts` | Dashboard happy path, send form error, navigation |

## Rollout / Migration Notes

### Backward Compatibility

`lib/finance-data.ts` is preserved for backward compatibility. Existing consumers not yet migrated can continue importing from it. The centralized fixtures mirror all data previously in `finance-data.ts`.

### Migration Path

1. **Phase 1 (Done — Issue #14)**: Centralize all data, update API routes, update `WalletService`, add tests, document
2. **Phase 2 (Future)**: Migrate remaining consumers (`db/mock-db.ts`, legacy finance components) to use `@/lib/fixtures`
3. **Phase 3 (Future)**: Deprecate `lib/finance-data.ts` and remove formatting helpers from it

### Type Changes

New types added to `lib/types.ts`:
- `FixtureType` — union type for fixture categories
- `MockDataConfig` — configuration for mock behavior (seed, latency, failure rate)
- `IFixtureFactory` — interface describing the factory API
- `TransactionsResponse` — API response wrapper for transaction lists
- `Issue14MergePayload` — extended merge analytics payload

### Duplicate Fixes

The following existing type issues were resolved:
- Removed duplicate `TransactionCategory` definition
- Removed duplicate `label` field in `Wallet` interface
- Removed duplicate `changePct` field in `CryptoAsset` interface
- Removed duplicate methods in `IFiatService` interface

## Security Note

- No private keys or secrets are included in fixture data
- `TEST_STELLAR_ADDRESS` is a well-known Stellar testnet address used only for mock purposes
- Environment variables (`NEXT_PUBLIC_STELLAR_NETWORK`, `STELLAR_HORIZON_URL`) control testnet vs mainnet behavior
- MERGE_ANALYTICS_URL is configured via GitHub repository secrets, never hardcoded

## CI Integration

The CI pipeline (`ci.yml`) runs the following steps on push/PR:
1. Unit tests (fixtures + services)
2. Component tests (React Testing Library)
3. Integration tests (API routes)
4. Coverage report (>90% threshold)
5. E2E tests with `@critical` tag

On merge to `main`, a POST request is sent to `MERGE_ANALYTICS_URL` with:
```json
{
  "event": "merge",
  "repository": "Orbit-Wal/Globe-Wallet",
  "branch": "main",
  "commit": "<sha>",
  "timestamp": "<iso>",
  "author": "<actor>",
  "issue": 14,
  "issues": [14],
  "status": "success",
  "coverage_verified": true,
  "fixture_coverage_verified": true
}
```

## QA Checklist

- [x] All fixture modules have >90% test coverage
- [x] API routes return data matching fixture definitions
- [x] Components render correctly with mock data
- [x] Accessibility attributes added (aria-label, role, aria-busy, aria-live)
- [x] Sent send, error, and success states render correctly
- [x] E2E happy path works end-to-end
- [x] TypeScript compiles without errors
- [x] All tests pass in CI
- [x] Documentation complete and cross-linked in README
- [x] Security: no secrets in code or docs
