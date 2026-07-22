# Issue #22 — Receive Page: QR Generation & Payment Request Sharing

## Design Rationale

The receive page was refactored from a monolithic page with a hardcoded Stellar address into a **service-integrated, testable flow** aligned with the send form (Issue #23) and dashboard (Issue #30):

1. **Address tab** — loads the wallet receive address from `WalletService.generateReceiveAddress()` via `useReceive`, renders an accessible QR code, and supports copy/share.
2. **Request tab** — collects optional amount and memo, validates input client-side, generates a **SEP-0007** payment URI (`web+stellar:pay?...`) for wallet-compatible QR codes, and supports copy/share of the URI or human-readable text.

Business logic lives in pure helpers (`lib/receive-utils.ts`) and `ReceiveService` so unit tests can reach **>90% coverage** without rendering React trees. UI is split into `ReceiveForm`, `QRDisplay`, and `ReceiveSummary` for component and E2E testing.

### Service Layer

`ReceiveService` (`lib/services/receive.service.ts`) wraps wallet address resolution and payment-request generation:

- `getReceiveAddress()` — returns validated public key
- `createPaymentRequest({ amount?, memo?, asset? })` — builds QR URI and share text

`useReceive` hook (`hooks/useReceive.ts`) connects React state to the wallet service and receive helpers.

### API Route

`GET /api/receive` and `POST /api/receive` expose mockable endpoints for integration tests and future mobile clients.

---

## API Contracts

### `GET /api/receive`

**Success response** (`200`):

```json
{
  "success": true,
  "address": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
}
```

**Validation error** (`422`):

```json
{
  "success": false,
  "error": "Invalid receive address"
}
```

### `POST /api/receive`

**Request body** (`PaymentRequestPayload`):

```json
{
  "amount": "25.5",
  "memo": "Invoice 42",
  "asset": "XLM"
}
```

**Success response** (`200`):

```json
{
  "success": true,
  "address": "G...",
  "qrValue": "web+stellar:pay?destination=G...&amount=25.5&memo_type=text&memo=Invoice%2042",
  "shareText": "Send XLM to: G...\nAmount: 25.5 XLM\nMemo: Invoice 42"
}
```

**Validation error** (`422`):

```json
{
  "success": false,
  "error": "Please enter a valid amount"
}
```

---

## New/Modified Types (`lib/types.ts`)

| Type | Description |
|---|---|
| `PaymentRequest` | Input for QR/share builders |
| `ReceiveQRData` | QR metadata for address or payment-request tabs |
| `ReceiveAddressResponse` | `GET /api/receive` response |
| `PaymentRequestPayload` | `POST /api/receive` request body |
| `PaymentRequestResponse` | `POST /api/receive` response |
| `PaymentAmountValidation` | Client-side amount validation result |

---

## Test Instructions

### Unit tests

```bash
npm run test:unit
# or specifically:
npx jest tests/unit/receive-utils.test.ts
npx jest tests/unit/services/receive.service.test.ts
```

### Component tests

```bash
npm run test:component
# or specifically:
npx jest tests/component/receive-form.test.tsx
```

### Integration tests

```bash
npm run test:integration
# or specifically:
npx jest tests/integration/receive-flow.test.tsx
```

### E2E tests

```bash
npm run test:e2e -- --grep "Receive Flow"
# requires dev server (Playwright starts it automatically)
```

### All tests with coverage

```bash
npm run test:coverage
```

---

## Test Matrix

| Layer | File | Scenarios |
|---|---|---|
| Unit | `receive-utils.test.ts` | Invalid amounts, SEP-0007 URI building, share text formatting |
| Unit | `receive.service.test.ts` | Address resolution, payment request success/failure |
| Unit | `wallet.service.test.ts` | `generateReceiveAddress()` |
| Component | `receive-form.test.tsx` | QR values, copy/share, a11y errors, tab keyboard nav |
| Integration | `receive-flow.test.tsx` | `GET/POST /api/receive`, UI QR updates |
| E2E | `receive-flow.spec.ts` | Happy path address + request tabs; invalid amount failure |

---

## Rollout / Migration Notes

- Receive address now comes from `WalletService` / `finance-data` (`TEST_STELLAR_ADDRESS`) — the previous hardcoded page address is removed.
- Payment QR format changed from custom `address?amount=` strings to **SEP-0007** URIs for wallet compatibility.
- `/api/receive` is additive; no existing routes were removed.
- `ReceiveForm` is imported by `app/receive/page.tsx`; quick actions link unchanged at `/receive`.

---

## Security Note

- **Never commit private keys or mnemonics.** All Stellar keys in this repo are mock/testnet public keys.
- `MERGE_ANALYTICS_URL` is stored as a GitHub repository secret and never hardcoded.
- Receive flows expose **public keys only** — no signing or secret material on this page.
- Use `NEXT_PUBLIC_STELLAR_NETWORK=testnet` in non-production environments; verify network before mainnet rollout.
- Amount validation is client-side UX; production should enforce limits server-side and on-chain.

---

## QA Checklist

- [ ] Address tab shows wallet service address (matches dashboard / send source)
- [ ] Address QR encodes plain public key
- [ ] Copy address writes to clipboard and shows toast
- [ ] Share address uses Web Share API or clipboard fallback
- [ ] Request tab accepts optional amount and memo
- [ ] Invalid / negative amount shows `role="alert"` error
- [ ] Copy/Share disabled when amount invalid
- [ ] Payment QR uses SEP-0007 URI with amount and memo
- [ ] Summary shows amount and memo when set
- [ ] `GET /api/receive` returns address
- [ ] `POST /api/receive` validates amount and returns `qrValue`
- [ ] All tests pass in CI
- [ ] No TypeScript errors (`npm run build`)

---

## Changelog

- Extracted `ReceiveForm`, `QRDisplay`, `ReceiveSummary`
- Added `lib/receive-utils.ts`, `ReceiveService`, `useReceive`
- Added `GET/POST /api/receive`
- Added unit, component, integration, and E2E tests
- CI runs Receive E2E grep and posts merge analytics for Issue #22
