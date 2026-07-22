# Issue #21 — Off-Ramp Payout Validation & Fee Calculation

## Overview

This document covers the design decisions, API contracts, test strategy, and rollout notes for Issue #21: adding unit tests for payout validation and fee calculation on the off-ramp page.

The core problem was that all fee computation and withdrawal validation logic lived inline inside a single React component, making it impossible to unit-test. The fix extracts that logic into pure, side-effect-free utility functions and a custom hook.

---

## Architecture

### Layers

```
app/off-ramp/page.tsx            ← page shell, wires up hook + method data
components/app/off-ramp-form.tsx ← pure UI form, receives hook result as prop
hooks/useOffRamp.ts              ← state management + derived validation/breakdown
lib/off-ramp-utils.ts            ← pure functions (NO React, NO side-effects)
components/dashboard/PayoutSummary.tsx ← transaction summary card
components/ui/FeeDisplay.tsx     ← fee badge with mixed-fee tooltip
lib/types.ts                     ← shared TypeScript types (WithdrawalValidationResult, etc.)
```

### Why this split

The hook (`useOffRamp`) owns React state and localStorage persistence. The utility module (`off-ramp-utils.ts`) is intentionally React-free so unit tests run in Node without a DOM environment — fast, deterministic, no render overhead.

---

## Fee Format Support

Three fee string formats are supported:

| Format       | Example      | Interpretation                    |
|--------------|--------------|-----------------------------------|
| Pure %       | `"1.5%"`     | 1.5% of USD value                 |
| Fixed $      | `"$15"`      | Flat $15 regardless of amount     |
| Mixed        | `"$15 + 1%"` | $15 flat + 1% of USD value        |

The `parseFeeString` function handles all three. The previous inline `getFeeAmount()` silently ignored the percentage component of mixed fees — this is now fixed.

---

## Key Functions (`lib/off-ramp-utils.ts`)

### `parseFeeString(feeStr)`
Parses a fee string into `{ fixedFee, percentFee }`. Returns `{ 0, 0 }` for empty/invalid input.

### `getUSDValue(amount, asset, rates?)`
Converts a crypto amount to USD. Returns 0 for unknown assets or invalid amounts (negative, NaN, Infinity).

### `computeFeeAmount(usdValue, feeStr)`
Combines `parseFeeString` + the USD value to return `{ feeAmount, fixedFee, percentFee }`.

### `getNetPayout(usdValue, feeAmount)`
Returns `max(0, usdValue - feeAmount)` — never negative.

### `buildPayoutBreakdown(cryptoAmount, asset, paymentMethodId, methods, rates?)`
Returns a full `PayoutBreakdown` object or `null` if inputs are invalid (zero amount, unknown method).

### `validateWithdrawal(input)`
Returns `{ valid, errorCode?, errorMessage? }`. Error codes:

| Code                  | Condition                                |
|-----------------------|------------------------------------------|
| `INVALID_AMOUNT`      | Non-numeric, zero, negative, or Infinity |
| `NO_PAYMENT_METHOD`   | Empty or whitespace `paymentMethodId`    |
| `UNKNOWN_ASSET`       | Asset not in rates map                   |
| `INSUFFICIENT_BALANCE`| Amount > balance for the asset           |
| `METHOD_NOT_FOUND`    | ID not in methods array                  |
| `METHOD_DISABLED`     | Method exists but `enabled: false`       |
| `BELOW_MIN_LIMIT`     | USD value < method minimum               |
| `ABOVE_MAX_LIMIT`     | USD value > method maximum               |

Validation is short-circuit: first failing check returns immediately.

---

## Hook API (`hooks/useOffRamp.ts`)

```typescript
const {
  amount,            // string — raw input value
  asset,             // "XLM" | "USDC" | "USDT"
  paymentMethodId,   // string
  isLoading,         // boolean
  backendError,      // string | null — from /api/off-ramp failures
  lastWithdrawal,    // PersistedWithdrawal | null — from localStorage
  breakdown,         // PayoutBreakdown | null — computed via useMemo
  validation,        // WithdrawalValidationResult — computed via useMemo
  setAmount,
  setAsset,
  setPaymentMethod,  // also persists to localStorage
  setMaxAmount,      // fills amount from balances[asset]
  submit,            // POSTs to /api/off-ramp
  clearError,
} = useOffRamp(methods, balances, rates?)
```

localStorage keys:
- `"globe-offramp-selected-method"` — persists chosen method across page loads
- `"globe-offramp-last-withdrawal"` — persists last successful withdrawal receipt

---

## Test Coverage

| File                                            | Type        | Tests |
|-------------------------------------------------|-------------|-------|
| `tests/unit/off-ramp-utils.test.ts`             | Unit        | 60+   |
| `tests/unit/services/off-ramp.service.test.ts`  | Unit        | Existing + baseline |
| `tests/component/PayoutSummary.test.tsx`         | Component   | 12    |
| `tests/component/PayoutSummary.test.tsx`         | Component   | 9 (FeeDisplay) |
| `tests/integration/off-ramp-api.test.ts`        | Integration | 11    |
| `tests/e2e/off-ramp-issue-21.spec.ts`           | E2E         | 9     |

Target: **>90% line/function/branch coverage** for `lib/off-ramp-utils.ts` and `hooks/useOffRamp.ts`.

---

## Running Tests

```bash
# Unit only
npm run test:unit -- off-ramp-utils

# Component
npm run test:component -- PayoutSummary

# Integration
npm run test:integration -- off-ramp-api

# E2E (requires dev server: npm run dev)
npm run test:e2e -- --grep "Issue #21"

# Coverage report
npm run test:coverage
```

---

## API Contract (`POST /api/off-ramp`)

**Request body:**
```json
{
  "methodId": "bank_1",
  "asset": "XLM",
  "amount": 200,
  "breakdown": {
    "usdValue": 19.00,
    "feeAmount": 0.285,
    "netPayout": 18.715
  }
}
```

**Success (200):**
```json
{
  "id": "tx_abc123",
  "status": "pending",
  "hash": null,
  "estimatedCompletion": "2024-01-15T12:00:00Z"
}
```

**Error (4xx):**
```json
{
  "error": "BELOW_MIN_LIMIT",
  "message": "Amount must be at least $10"
}
```

---

## Security Notes

- No private keys or wallet secrets are passed to the off-ramp API.
- `MERGE_ANALYTICS_URL` is stored as a GitHub Actions secret; it is never logged.
- localStorage stores only method IDs and withdrawal receipts — no sensitive financial credentials.
- All fee computation happens client-side for UX preview only; the server re-validates on submit.

---

## Rollout Notes

- The utility module is a pure extraction — no behavioral changes to the existing off-ramp page beyond fixing the mixed-fee bug.
- `useOffRamp` rehydrates `paymentMethodId` from localStorage, so returning users keep their last selection.
- The `OffRampForm` component is additive — the existing off-ramp page can adopt it incrementally.
- Coverage thresholds added to `jest.config.js` will fail CI if coverage drops below 90% on the new modules.

---

## Related Issues

- [Issue #25](./issue-25.md) — Off-ramp page UI (cash-out flow)
- [Issue #14](./issue-14.md) — Send form (similar extraction pattern)
