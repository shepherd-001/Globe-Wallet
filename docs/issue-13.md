# Issue #13 — Transaction History: Persistent Transactions, Backend API, Sync & Tests

## Design Rationale

### Problem Statement
The original `GET /api/transactions` route was thin: it read from the in-memory `WalletService.getTransactionHistory()` with no pagination, no search, no date filtering, no sort control, and no way to add transactions from client-side flows or external sync.

### Solution Overview
A four-layer architecture:

```
Stellar Network (simulated)
        │ sync
        ▼
TransactionSyncService         ← lib/services/transaction-sync.service.ts
        │ read/write
        ▼
MockDB                         ← lib/db/mock-db.ts  (enhanced)
        │
        ▼
GET & POST /api/transactions   ← app/api/transactions/route.ts
GET & POST /api/transactions/sync ← app/api/transactions/sync/route.ts
        │
        ▼
useTransactionHistory()        ← hooks/useTransactionHistory.ts
        │
        ▼
TransactionHistoryView         ← components/app/transaction-history-view.tsx
TransactionStats               ← components/dashboard/transaction-stats.tsx
TransactionStatusBadge         ← components/ui/transaction-status-badge.tsx
```

### Key Decisions
- **Persistence abstraction**: `MockDB` is the single source of truth for transactions. The `WalletService` still serves the dashboard, but full history queries go through `db.queryTransactions()`.
- **Paginated API**: The enhanced `GET /api/transactions` supports `limit`, `offset`, `search`, `from`, `to`, `type`, `category`, `asset`, `status`, `sortBy`, `sortOrder`, and a `paginate` flag that toggles between a `TransactionPage` object (default) and a flat array (legacy).
- **Sync service**: `TransactionSyncService.syncFromNetwork()` simulates fetching new ledger entries from Stellar; duplicate detection uses `stellarHash`. In production this would call Horizon.
- **Safe concurrent sync**: a `isSyncing` flag prevents overlapping sync calls.
- **Hook architecture**: `useTransactionHistory` handles all state (loading, error, pagination, sync) so the view is stateless.

---

## API Contracts

### `GET /api/transactions`

| Param | Type | Default | Description |
|---|---|---|---|
| `paginate` | `'true'|'false'` | `'true'` | Return `TransactionPage` or flat array |
| `limit` | number | 20 | Results per page (capped at 100) |
| `offset` | number | 0 | Skip N rows |
| `type` | `'in'|'out'` | — | Direction filter |
| `category` | `TransactionCategory` | — | Category filter |
| `asset` | `AssetCode` | — | Asset filter |
| `status` | `'completed'|'pending'|'failed'` | — | Status filter |
| `search` | string | — | Full-text search on name, detail, address, hash |
| `from` | ISO 8601 | — | Date lower bound |
| `to` | ISO 8601 | — | Date upper bound |
| `sortBy` | `'date'|'amount'|'asset'` | `'date'` | Sort field |
| `sortOrder` | `'asc'|'desc'` | `'desc'` | Sort direction |

**Response (paginated)**:
```json
{ "success": true, "data": { "data": [...], "total": 42, "offset": 0, "limit": 20, "hasMore": true } }
```

**Response (flat)**:
```json
{ "success": true, "data": [...] }
```

### `POST /api/transactions`

**Body** (`AddTransactionRequest`):
```json
{
  "type": "receive",
  "amount": 50.0,
  "asset": "XLM",
  "address": "GDXSPAY...",
  "category": "deposit",
  "name": "Deposit from swap",
  "detail": "Via Stellar DEX",
  "currency": "USD",
  "stellarHash": "0xabc..."
}
```
**Response**: `201` with `{ "success": true, "data": [<Transaction>] }`
**Errors**: `400` for missing required fields or invalid amount.

### `GET /api/transactions/sync`
Returns `TransactionSyncStatus`:
```json
{ "success": true, "data": { "lastSyncAt": "2025-01-20T10:00:00Z", "isSyncing": false, "totalSynced": 5, "pendingCount": 0 } }
```

### `POST /api/transactions/sync`
Triggers a network sync. Returns `TransactionSyncResult`:
```json
{ "success": true, "data": { "added": 2, "updated": 0, "failed": 0, "lastSyncAt": "2025-01-20T10:00:00Z" } }
```

---

## New Types (lib/types.ts)

| Type | Description |
|---|---|
| `TransactionsResponse` | `{ success, data?: Transaction[], error? }` — existing flat-array API response |
| `TransactionFilters` | Full filter bag for queries (type, category, asset, status, from, to, search, limit, offset, sortBy, sortOrder) |
| `TransactionSortField` | `'date' | 'amount' | 'asset'` |
| `TransactionSortOrder` | `'asc' | 'desc'` |
| `TransactionPage` | Paginated result: `{ data, total, offset, limit, hasMore }` |
| `TransactionPageResponse` | API envelope wrapping `TransactionPage` |
| `AddTransactionRequest` | POST body for creating a transaction |
| `TransactionSyncStatus` | `{ lastSyncAt, isSyncing, totalSynced, pendingCount }` |
| `TransactionSyncResult` | `{ added, updated, failed, lastSyncAt }` — returned from sync operations |
| `ITransactionSyncService` | Interface for sync service |

---

## New Helpers (lib/transaction-utils.ts)

| Function | Signature | Description |
|---|---|---|
| `filterAndSortTransactions` | `(txs, SortableFilters) → Transaction[]` | Applies all filters + sort in one pass |
| `searchTransaction` | `(tx, query) → boolean` | Full-text search on name, detail, address, stellarHash |
| `generateTransactionId` | `() → string` | Returns `tx_{timestamp}_{random}` |
| `isoToDisplayDate` | `(iso) → string` | Converts ISO timestamp to "Today, 09:42" format |

---

## Test Matrix

| Suite | File | Cases |
|---|---|---|
| Unit — MockDB | `tests/unit/db/mock-db.test.ts` | 14 |
| Unit — transaction-utils | `tests/unit/utils/transaction-utils.test.ts` | 21 |
| Unit — TransactionSyncService | `tests/unit/services/transaction-sync.service.test.ts` | 11 |
| Component — TransactionHistoryView | `tests/component/app/transaction-history-view.test.tsx` | 14 |
| Integration — transactions-api | `tests/integration/transactions-api.test.ts` | 13 |
| E2E — transaction-history | `tests/e2e/transaction-history.spec.ts` | 11 |

### Running tests

```bash
# All suites touching issue #13
npm run test:unit -- --testPathPattern="mock-db|transaction-utils|transaction-sync"
npm run test:component -- --testPathPattern="transaction-history-view"
npm run test:integration -- --testPathPattern="transactions-api"
npm run test:e2e -- --grep "@transaction-history"
```

---

## Rollout / Migration Notes

1. **No breaking changes to existing dashboard**: `WalletService.getTransactionHistory()` is untouched; the dashboard transaction list still works.
2. **MockDB is in-memory**: restarts reset data. In production, replace `MockDB` with a real DB client (e.g., Drizzle + Postgres) that implements the same interface.
3. **Horizon integration**: Replace `SIMULATED_STELLAR_TRANSACTIONS` in `TransactionSyncService.syncFromNetwork()` with a real `StellarSdk.Server.payments()` cursor call.
4. **Pagination migration**: Consumers that relied on the flat-array response should pass `paginate=false` or update to read `response.data.data`.

---

## Security Notes

- No private keys stored in this layer. Transaction addresses are public keys only.
- `MERGE_ANALYTICS_URL` is consumed only in CI via GitHub secret — never hardcoded.
- The `POST /api/transactions` validates that `amount > 0` and required fields are present before writing.
- In production, all mutation endpoints must be behind authentication middleware (JWT/session).
- Never commit `.env.local` or wallet private keys. Use `testnet` for all development.

---

## QA Checklist

- [ ] `npm run test:unit -- --testPathPattern="mock-db"` — 14 tests pass
- [ ] `npm run test:unit -- --testPathPattern="transaction-utils"` — 21 tests pass
- [ ] `npm run test:unit -- --testPathPattern="transaction-sync"` — 11 tests pass
- [ ] `npm run test:component -- --testPathPattern="transaction-history-view"` — 14 tests pass
- [ ] `npm run test:integration -- --testPathPattern="transactions-api"` — 13 tests pass
- [ ] `npm run test:e2e -- --grep "@transaction-history"` — 6 API tests pass; UI tests skip gracefully if /transactions page not routed
- [ ] `GET /api/transactions?paginate=true&limit=1` returns `hasMore: true` when multiple transactions exist
- [ ] `POST /api/transactions` with valid body returns `201` and a `tx_*` id
- [ ] `POST /api/transactions/sync` increments `totalSynced`
- [ ] `TransactionHistoryView` search input debounces and filters the list
- [ ] Clicking "Incoming" tab passes `type=in` to the hook
- [ ] `npm run build` — zero TypeScript errors
