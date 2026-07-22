# Issue #25 — End-to-End Testing: Core Wallet Flows

## Design Rationale

Globe Wallet's E2E suite uses [Playwright](https://playwright.dev) to verify the critical user
journeys in real browser environments. Tests run against the live dev server and assert behaviour
from the user's perspective — no mocking, no implementation details.

Prior to this issue, E2E coverage existed only for the send flow. This issue extends coverage to
every core wallet journey: receive, convert, off-ramp, savings, cards, and profile.

### Why Playwright

- Runs in Chromium, Firefox, and WebKit from a single test file.
- First-class support for async UI patterns (waitFor, locators, retries).
- HTML report output makes CI failures easy to diagnose.
- Already configured in `playwright.config.ts` — no new tooling required.

### Test philosophy

- **Assert outcomes, not implementation.** Tests check what the user sees and can do, not how the
  component is wired internally.
- **Resilient locators.** Use ARIA roles and labels as the primary selector strategy. Fall back to
  `data-testid` only when no semantic role exists.
- **One describe block per flow.** Each flow is isolated — a failure in the convert flow does not
  abort the receive flow tests.
- **Minimal setup.** No global auth fixtures or database seeding — the app works with mock data
  out of the box.

---

## Test Files Added

| File | Flow | Scenarios |
|---|---|---|
| `tests/e2e/receive-flow.spec.ts` | Receive XLM | Address display, QR render, tab switch, payment request, navigation |
| `tests/e2e/convert-flow.spec.ts` | Convert assets | Rate card, amount calculation, swap, fee summary, error on over-balance |
| `tests/e2e/off-ramp-flow.spec.ts` | Cash Out / Off-ramp | Withdraw tab, method selection, summary, error states, methods tab |
| `tests/e2e/savings-cards-profile.spec.ts` | Savings / Cards / Profile | Smoke: page loads, key elements present, back navigation |

Existing E2E specs (not modified):

| File | Flow |
|---|---|
| `tests/e2e/send-flow.spec.ts` | Send — happy path, invalid address, back button |
| `tests/e2e/wallet-send.spec.ts` | Wallet send — validation errors, success, form reset |
| `tests/e2e/dashboard.spec.ts` | Dashboard — balance, navigation to send |
| `tests/e2e/finance-flow.spec.ts` | Finance — balance visibility, transaction list, error states |

---

## API Contracts

The E2E tests exercise the following API routes indirectly (via the running app):

### `GET /api/stellar`
Returns account info. Used by the receive page to display the Stellar address.

### `POST /api/off-ramp` *(called by off-ramp page on form submit)*
Initiates a withdrawal. In the test environment this is either handled by the mock API route or
intercepted by `page.route()` for failure-path tests.

### `GET /api/rates`
Provides conversion rates used by the convert page.

### `GET /api/assets`
Returns crypto asset list and balances used across the dashboard and convert pages.

---

## Test Instructions

### Prerequisites

```bash
pnpm install
npx playwright install --with-deps
```

### Run all E2E tests (Playwright starts the dev server automatically)

```bash
npm run test:e2e
```

### Run a specific flow

```bash
npm run test:e2e -- --grep "Receive Flow"
npm run test:e2e -- --grep "Convert Flow"
npm run test:e2e -- --grep "Off-ramp Flow"
npm run test:e2e -- --grep "Savings page"
```

### Run only the new issue-25 specs

```bash
npx playwright test tests/e2e/receive-flow.spec.ts tests/e2e/convert-flow.spec.ts tests/e2e/off-ramp-flow.spec.ts tests/e2e/savings-cards-profile.spec.ts
```

### View the HTML report after a run

```bash
npx playwright show-report
```

### CI execution

The CI pipeline runs the full E2E suite after unit, component, and integration tests pass.
See `.github/workflows/ci.yml`. Playwright is configured with:
- `retries: 2` on CI (to handle transient timing issues)
- `workers: 1` on CI (avoids port conflicts)
- `forbidOnly: true` on CI (fails if `test.only` is accidentally committed)

---

## Rollout & Migration Notes

- All new spec files are additive — no existing tests were modified.
- The new tests rely on elements already present in the pages (`role`, `label`, existing class
  patterns). No changes to application code were required.
- If a page adds or removes elements that these tests target, update the relevant spec file in the
  same PR.

### Selector conventions used in this issue

| Priority | Strategy | Example |
|---|---|---|
| 1st | ARIA role + name | `page.getByRole('button', { name: /copy/i })` |
| 2nd | ARIA label | `page.getByLabel(/amount/i)` |
| 3rd | `data-testid` | `page.getByTestId('send-error')` |
| 4th | Text content | `page.getByText(/you'll receive/i)` |
| Last | CSS class fragment | `page.locator('[class*="border-primary"]')` |

---

## Security Note

- No private keys or secrets appear in any test file.
- Tests use mock data seeded in `lib/finance-data.ts` — no real Stellar transactions are submitted.
- The `MERGE_ANALYTICS_URL` is a GitHub Actions secret; it is never referenced in test files.
- Do not add real account credentials to test fixtures. Use only testnet addresses (starting with
  `G`) in assertions.

---

## QA Checklist

- [ ] `npm run test:e2e` passes locally with all new specs green
- [ ] No `test.only` or `test.skip` left in committed code
- [ ] Each new spec file has a matching entry in this doc's test files table
- [ ] CI pipeline runs new specs and passes
- [ ] `docs/issue-25.md` cross-linked in `README.md`
- [ ] Merge triggers analytics POST to `MERGE_ANALYTICS_URL`
