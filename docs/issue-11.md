# Issue #11 — Crypto-Native Send Flow: Federated Address Lookup

## Design Rationale

### Problem

The original send form accepted only raw 56-character Stellar public keys (`G…`). While correct, this is not how people actually share wallet addresses in the Stellar ecosystem — the federation protocol (SEP-0002) lets users register human-readable names like `alice*stellar.org` that resolve to real public keys, the same way email addresses work.

Without federation support, Globe Wallet falls short of the "crypto-native" experience offered by Lobstr, Solar, and other production Stellar wallets.

### Solution

This issue adds **Stellar Federation Protocol support** across the full stack:

| Layer | Change |
|---|---|
| `lib/helpers/send-utils.ts` | Pure helpers: `isFederatedAddress`, `validateSendInput`, `formatFederatedDisplay` |
| `lib/services/federation.service.ts` | `FederationService` — mock registry + `lookup()` implementing SEP-0002 shape |
| `hooks/useAddressLookup.ts` | React hook that debounces, calls `/api/federation`, and surfaces `AddressLookupResult` |
| `app/api/federation/route.ts` | `GET /api/federation?q=…` route proxying the federation service |
| `components/ui/address-lookup-badge.tsx` | Inline status badge (spinner → green chip, amber warning, red error) |
| `components/app/send-form.tsx` | Updated to detect federated input, show badge, gate confirmation on resolved status |
| `components/dashboard/send-summary.tsx` | Updated to surface `federatedInput` and `federationMemo` in confirmation |
| `lib/types.ts` | Added `AddressLookupStatus`, `AddressLookupResult`, `FederatedAddress`, `IFederationService`; extended `SendConfirmation` |

### Address Resolution Flow

```
User types alice*stellar.org
         │
         ▼
  isFederatedAddress()  →  true
         │
         ▼  (400 ms debounce)
  GET /api/federation?q=alice*stellar.org
         │
    ┌────┴────────┐
    │             │
  200 OK        404 / 502
    │             │
  resolved      not-found / error
    │
  AddressLookupBadge shows shortened G-key
         │
  User clicks "Review Send"
         │  (guard: status must be 'resolved')
         ▼
  SendSummary shows "alice*stellar.org → GDXSPAY…T6BNRX"
         │
  User clicks "Confirm Send"
         │
  wallet.sendPayment(resolvedKey, amount, asset, memo)
```

### Why debounce?

Without debouncing, every keystroke in the address field fires a network request. A 400 ms debounce gives the user time to finish typing before any fetch is dispatched, reducing unnecessary API calls by ~10×.

### Why a dedicated API route?

Calling federation servers directly from the browser would expose requests to CORS issues and bypass any future rate-limiting or caching layers. Routing through `/api/federation` lets the server side handle those concerns cleanly.

---

## API Contracts

### `GET /api/federation?q=user*domain.tld`

**Success** (`200`):
```json
{
  "stellar_address": "alice*stellar.org",
  "account_id": "GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX"
}
```

**With memo** (`200`):
```json
{
  "stellar_address": "test*globe.wallet",
  "account_id": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  "memo": "GLOBE-TEST",
  "memo_type": "text"
}
```

**Not found** (`404`):
```json
{ "error": "ERR_NOT_FOUND: no federation record for \"nobody*x.example\"" }
```

**Bad format** (`400`):
```json
{ "error": "ERR_NOT_FEDERATED: address does not match user*domain.tld format" }
```

**Lookup error** (`502`):
```json
{ "error": "ERR_LOOKUP_FAILED" }
```

---

## New / Modified Types

| Type | Location | Notes |
|---|---|---|
| `AddressLookupStatus` | `lib/types.ts` | `'idle' \| 'resolving' \| 'resolved' \| 'not-found' \| 'error'` |
| `AddressLookupResult` | `lib/types.ts` | Returned by `useAddressLookup` and `FederationService.lookup()` |
| `FederatedAddress` | `lib/types.ts` | Parsed federation record struct |
| `IFederationService` | `lib/types.ts` | Interface for `FederationService` (injectable in tests) |
| `SendConfirmation.federatedInput?` | `lib/types.ts` | Carries original `user*domain` input through to confirmation summary |
| `SendConfirmation.federationMemo?` | `lib/types.ts` | Federation record memo surfaced in `SendSummary` |

---

## Security Note

- **No private keys** pass through this feature at any layer. Only public account IDs and text memos are handled.
- **Testnet vs mainnet**: The mock registry is used in dev/test. In production, replace `FederationService.lookup()` with a real SEP-0002 HTTP fetch. Gate on `NEXT_PUBLIC_STELLAR_NETWORK=mainnet` to prevent sending to testnet addresses accidentally.
- **Validate returned addresses**: `FederationService.lookup()` calls `isValidStellarAddress()` on the returned `account_id` before surfacing it. The API route does the same via the service. Callers should not skip this check if integrating the service directly.
- **Environment variable**: Any analytics or telemetry URLs (e.g. `MERGE_ANALYTICS_URL`) must be stored as repository secrets, never hardcoded.

---

## Test Instructions

### Run unit tests
```bash
npm run test:unit -- --testPathPattern=send-utils
```

### Run component tests
```bash
npm run test:component -- --testPathPattern=address-lookup-badge
```

### Run integration tests
```bash
npm run test:integration -- --testPathPattern=send-federation
```

### Run E2E tests (Issue #11)
```bash
npx playwright test --grep "Issue #11"
```

### Run full suite
```bash
npm test && npx playwright test
```

---

## Mock Federation Registry

For dev and test environments, `FederationService` uses a built-in registry:

| Federated address | Resolves to | Memo |
|---|---|---|
| `alice*stellar.org` | `GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX` | — |
| `test*globe.wallet` | `GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF` | `GLOBE-TEST` |

Add entries to `MOCK_FEDERATION_REGISTRY` in `lib/services/federation.service.ts` to extend coverage.

---

## Rollout / Migration Notes

1. **No breaking changes** — existing G-key-only send flow is entirely unchanged. Federation is additive.
2. **Feature detection** — the `AddressLookupBadge` only renders when `status !== 'idle'`, so users who never type a federated address see zero UI change.
3. **Production federation server** — when ready, replace the `FederationService` mock with a real SEP-0002 implementation (fetch domain TOML → federation endpoint). The `IFederationService` interface is already wired up for easy substitution.
4. **Caching** — consider adding an in-memory LRU cache in `FederationService.lookup()` to avoid re-fetching the same address within a session.

---

## QA Checklist

- [ ] Typing `alice*stellar.org` shows spinner then green resolved badge
- [ ] Typing `nobody*unknown.example` shows amber not-found badge
- [ ] Clicking "Review Send" while badge is in resolving state shows blocking error
- [ ] Clicking "Review Send" after resolution shows confirmation summary with `alice*stellar.org → GDXSPAY…T6BNRX`
- [ ] Confirmation summary shows federation memo when present
- [ ] Confirming sends to the resolved G-key, not to the raw federated string
- [ ] Plain G-key flow is unaffected (no badge rendered)
- [ ] Contact-picker selected address bypasses federation lookup
- [ ] All unit, component, integration, and E2E tests pass in CI
