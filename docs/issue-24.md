# Issue #24 — Accessibility Audit: Automated axe Checks for Main Pages

## Overview

Globe Wallet now ships with **automated accessibility (a11y) checks** for all main wallet routes. The implementation uses:

- **[jest-axe](https://github.com/nickcolley/jest-axe)** for fast component-level scans in Jest
- **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)** for full-page E2E scans in real browsers
- A mockable **`/api/a11y`** route and **`useAccessibilityAudit`** hook for integration testing and future CI reporting dashboards

Cross-references:

- [Developer Onboarding (Issue #29)](./issue-29.md) — testing conventions and `getByRole` guidance
- [E2E Testing (Issue #25)](./issue-25.md) — Playwright setup and browser matrix

---

## Design Rationale

### Why axe?

[axe-core](https://github.com/dequelabs/axe-core) is the industry-standard engine used by jest-axe and Playwright integrations. It maps checks to **WCAG 2.x Level A/AA** criteria and produces actionable violation reports with impact levels.

### Layered testing strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Jest | Violation parsing, path validation, audit summaries |
| Component | jest-axe + RTL | Skip link, shell landmarks, bottom nav, dashboard header |
| Integration | Jest + mocked fetch | Hook → `/api/a11y` request/response contract |
| E2E | @axe-core/playwright | Critical routes in Chromium with interactive failure paths |

Component tests catch regressions quickly; E2E tests validate composed pages including navigation, forms, and theme styles.

### UI improvements bundled with Issue #24

- **Skip link** (`components/ui/skip-link.tsx`) targeting `#main-content`
- **Main landmark** in `AppShell` with focusable `main` element
- **`aria-current="page"`** on active bottom navigation links
- **Empty transaction state** announced via `role="status"` + `aria-live="polite"`
- **Dashboard header** icon buttons and search input receive accessible names

---

## API Contracts

### `GET /api/a11y`

Returns the audit configuration catalog.

**Response `200`:**

```json
{
  "standard": "WCAG2AA",
  "pages": [
    { "path": "/", "label": "Dashboard", "critical": true },
    { "path": "/send", "label": "Send Money", "critical": true }
  ]
}
```

### `POST /api/a11y`

Runs a mock audit for a scoped page (used by integration tests; E2E uses axe directly in the browser).

**Request body:**

```json
{
  "path": "/send",
  "minImpact": "moderate"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | Yes | Must be one of the configured main routes (starts with `/`) |
| `minImpact` | `A11yImpactLevel` | No | Filter threshold: `critical`, `serious`, `moderate`, `minor` |

**Response `200` (pass):**

```json
{
  "success": true,
  "path": "/",
  "standard": "WCAG2AA",
  "summary": {
    "pagePath": "/",
    "violationCount": 0,
    "byImpact": { "critical": 0, "serious": 0, "moderate": 0, "minor": 0, "unknown": 0 },
    "passed": true,
    "scannedAt": "2026-06-19T12:00:00.000Z"
  },
  "violations": []
}
```

**Response `422` (invalid path):**

```json
{
  "success": false,
  "path": "/admin",
  "error": "Path \"/admin\" is not in the accessibility audit scope",
  "violations": []
}
```

### TypeScript types

Defined in `lib/types.ts`:

- `A11yPageConfig`, `A11yViolation`, `A11yAuditSummary`
- `A11yAuditRequest`, `A11yAuditResponse`, `IA11yService`

---

## Running Tests

### Unit & service tests

```bash
npm run test:unit -- tests/unit/a11y
npm run test:unit -- tests/unit/hooks/useAccessibilityAudit.test.ts
npm run test:unit -- tests/unit/services/a11y.service.test.ts
```

### Component accessibility (jest-axe)

```bash
npm run test:a11y
# or
npm run test:component -- tests/component/accessibility
```

### Integration

```bash
npm run test:integration -- tests/integration/a11y
```

### E2E (Playwright + axe)

```bash
npm run test:a11y:e2e
# equivalent
npm run test:e2e -- --grep "Issue #24"
```

### Full CI parity

```bash
npm run build
npm run test:unit
npm run test:component
npm run test:integration
npm run test:a11y
npm run test:a11y:e2e
```

---

## Test Matrix

### Unit (`tests/unit/a11y/audit-utils.test.ts`)

| Case | Expected |
|------|----------|
| Invalid impact string | Normalized to `unknown` |
| Sort by impact | `critical` before `minor` |
| Filter by `minImpact` | Only violations at or above threshold |
| Empty violations | `summary.passed === true` |
| Out-of-scope path | Validation error message |

### Component (`tests/component/accessibility/`)

| Component | Checks |
|-----------|--------|
| `SkipLink` | href target, axe clean |
| `AppShell` | `#main-content` landmark, skip link present |
| `BottomNav` | `aria-current`, keyboard focus, axe clean |
| `Header` | Icon button labels, search label, axe clean |

### Integration

| Flow | Expected |
|------|----------|
| `GET /api/a11y` | Returns 8 pages, WCAG2AA |
| `POST /api/a11y` valid path | 200 + summary |
| `POST /api/a11y` invalid path | 422 |
| Hook → API (mocked) | Config load then audit, no optimistic pass on failure |

### E2E (`tests/e2e/accessibility.spec.ts`)

| Scenario | Route / action |
|----------|----------------|
| Happy path scans | `/`, `/send`, `/receive`, `/convert`, `/off-ramp` |
| Skip link | Tab → Enter focuses `#main-content` |
| Failure path | Invalid send address → error visible → axe clean |

---

## CI Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes:

1. `npm run test:a11y` after integration tests
2. `npm run test:a11y:e2e` after Playwright browser install
3. Merge analytics POST on successful `main` push includes `"issue": 24`

Configure the analytics endpoint via repository secret:

```
MERGE_ANALYTICS_URL=https://your-analytics-endpoint.example/merge
```

If the secret is unset, CI skips the POST gracefully.

---

## Rollout / Migration Notes

- **No breaking API changes** for wallet operations; `/api/a11y` is additive.
- Existing pages automatically gain skip link + main landmark via `AppShell` — no route changes required.
- Future work: wire `POST /api/a11y` to a headless Playwright worker for server-side reports.
- When adding new top-level routes, update `lib/a11y/pages.ts` and extend E2E scans.

---

## Security & Privacy

- **No private keys** are used by accessibility tooling. Audits inspect DOM structure and ARIA attributes only.
- **`MERGE_ANALYTICS_URL`** must be configured as a GitHub Actions secret — never commit endpoint URLs or tokens.
- E2E tests run against the **local dev server** with fixture/mock data (testnet-style addresses). Do not point CI at mainnet accounts holding real funds.
- Violation reports may include HTML snippets from the DOM; scrub before sharing externally if testing with production-like data.

---

## QA Checklist

Use this checklist for manual verification and PR review:

- [ ] Skip link visible on keyboard Tab from page load
- [ ] `#main-content` receives focus after activating skip link
- [ ] Active bottom nav item shows `aria-current="page"`
- [ ] Send form validation errors are associated with inputs (`aria-invalid`, `aria-describedby`)
- [ ] Empty transaction list announces "No transactions yet" to screen readers
- [ ] Dashboard header icon buttons have accessible names
- [ ] `npm run test:a11y` passes locally
- [ ] `npm run test:a11y:e2e` passes locally
- [ ] No secrets in `docs/issue-24.md` or test fixtures

---

## Definition of Done

- [x] Types in `lib/types.ts` for audit contracts
- [x] Services/helpers in `lib/a11y/` and `lib/services/a11y.service.ts`
- [x] Hook: `hooks/useAccessibilityAudit.ts`
- [x] API route: `app/api/a11y/route.ts`
- [x] UI fixes across `components/app`, `components/ui`, `components/dashboard`
- [x] Unit, component, integration, and E2E tests
- [x] Documentation in `docs/issue-24.md` cross-linked from README
- [x] CI runs a11y tests and posts merge analytics for Issue #24

---

## Changelog

### Added

- Automated axe checks via jest-axe (component) and @axe-core/playwright (E2E)
- `/api/a11y` mock audit endpoint and `useAccessibilityAudit` hook
- Skip link, main landmark, navigation and header accessibility improvements
- Test suite under `tests/unit/a11y`, `tests/component/accessibility`, `tests/e2e/accessibility.spec.ts`

### Changed

- `AppShell` wraps page content in `<main id="main-content">`
- `BottomNav` uses `aria-current="page"` for active route
- `TransactionList` empty state uses live region semantics
