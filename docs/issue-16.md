# Issue #16 — App Shell & Accessibility: Safe-Area Layout, Nav Semantics, A11y Tests & Docs

## Design Rationale

### Problem
The existing app shell had three core accessibility and layout deficiencies:

1. **Missing `viewport-fit=cover`** — Without this meta-viewport attribute, iOS devices with a notch or Dynamic Island ignored `env(safe-area-inset-*)` values, causing the bottom nav to render behind the home indicator and page content to be obscured.

2. **Semantic gaps in navigation** — `<ul>` inside `<nav>` had no `role="list"` (required when list styles are reset by Tailwind / CSS normalisation), nav links lacked explicit `aria-label` attributes, and the keyboard focus ring was absent.

3. **`<header>` landmark confusion** — `PageHeader`'s `<header>` is nested inside `<main>`, so it does NOT carry the implicit `banner` landmark that a top-level `<header>` would. Without an `aria-label` it was invisible to screen-reader navigation.

### Solution
- Export `viewport: Viewport` from `app/layout.tsx` with `viewportFit: 'cover'` so the browser exposes safe-area env values.
- Introduce `lib/a11y/safe-area.ts` — pure CSS-string helpers (`safeAreaInset`, `SAFE_AREA_MAIN_PB`, `SAFE_AREA_BOTTOM_NAV_PB`) consumed by `AppShell` and `BottomNav`.
- Add `role="list"` + `aria-label` + `focus-visible:ring` to `BottomNav`.
- Add explicit `aria-label` to `PageHeader`'s `<header>`, deterministic `id` on `<h1>`, and `role="group"` on the action slot.
- Enhance `SkipLink` focus ring (contrasting `ring-offset-primary`).
- Add `role="search"` wrapper + `aria-label="Dashboard header"` to the dashboard `Header`.
- New `ShellService` / `GET /api/shell` / `useShell` hook follow the established service-container pattern.

## Folders Modified (≥ 6)

| Folder | Changes |
|---|---|
| `app/` | `layout.tsx` — `Viewport` export with `viewportFit: cover` |
| `app/api/shell/` | `route.ts` — `GET /api/shell` returning `ShellConfigResponse` |
| `components/app/` | `app-shell.tsx`, `bottom-nav.tsx`, `page-header.tsx` |
| `components/ui/` | `skip-link.tsx` — enhanced focus ring |
| `components/dashboard/` | `header.tsx` — `role="search"` wrapper + `aria-label` |
| `lib/` | `types.ts` (NavItem etc.), `a11y/safe-area.ts` (new), `services/shell.service.ts` (new) |
| `hooks/` | `useShell.ts` (new) |
| `tests/` | unit × 2, component × 1, integration × 1, e2e × 1 |
| `docs/` | `issue-16.md` (this file) |

## API Contract

### `GET /api/shell`

**Success response** `200`

```json
{
  "success": true,
  "config": {
    "navItems": [
      { "label": "Home",    "href": "/",        "iconName": "Home",           "exact": true  },
      { "label": "Send",    "href": "/send",    "iconName": "ArrowLeftRight", "exact": false },
      { "label": "Cards",   "href": "/cards",   "iconName": "CreditCard",     "exact": false },
      { "label": "Savings", "href": "/savings", "iconName": "PiggyBank",      "exact": false },
      { "label": "Profile", "href": "/profile", "iconName": "User",           "exact": false }
    ],
    "mainContentId": "main-content",
    "skipLinkLabel": "Skip to main content",
    "safeAreaEnabled": true
  }
}
```

**Error response** `500`

```json
{ "success": false, "error": "Internal server error" }
```

## New TypeScript Types (`lib/types.ts`)

```typescript
interface NavItem         { label: string; href: string; iconName: string; exact?: boolean }
interface AppShellConfig  { navItems: NavItem[]; mainContentId: string; skipLinkLabel: string; safeAreaEnabled: boolean }
interface SafeAreaInsets  { top: string; bottom: string; left: string; right: string }
interface ShellConfigResponse { success: boolean; config?: AppShellConfig; error?: string }
interface IShellService   { getConfig(): AppShellConfig; getNavItems(): NavItem[]; getMainContentId(): string; getSafeAreaInsets(): SafeAreaInsets }
```

## Safe-Area CSS Values

| Constant | Value | Usage |
|---|---|---|
| `SAFE_AREA_MAIN_PB` | `calc(6rem + env(safe-area-inset-bottom, 0px))` | `<main>` padding-bottom |
| `SAFE_AREA_BOTTOM_NAV_PB` | `calc(0.5rem + env(safe-area-inset-bottom, 0px))` | BottomNav `<ul>` padding-bottom |
| `SAFE_AREA_STATUS_BAR_PT` | `env(safe-area-inset-top, 0px)` | Status-bar clearance |

## BottomNav Changes

| Before | After |
|---|---|
| `<ul className="... py-2">` | `<ul role="list" className="... pt-2" style={{ paddingBottom: SAFE_AREA_BOTTOM_NAV_PB }}>` |
| Link has no explicit `aria-label` | `aria-label={item.label}` on each `<Link>` |
| No keyboard focus ring | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` |
| Icon + label text mixed in same node | Icon wrapped in `aria-hidden="true"` span; label in separate `aria-hidden="true"` span; `aria-label` on link = screen-reader text |

## Test Instructions

```bash
# Unit — safe-area helpers + ShellService
npm run test:unit -- --testPathPattern="safe-area|shell.service"

# Component — PageHeader a11y
npm run test:component -- --testPathPattern="page-header-a11y"

# Existing a11y component suite (AppShell, BottomNav, DashboardHeader)
npm run test:a11y

# Integration — /api/shell
npm run test:integration -- --testPathPattern="shell-api"

# E2E — shell a11y (needs dev server on :3000)
npx playwright test tests/e2e/app-shell-a11y.spec.ts
```

## Security Notes

- No private keys or secrets in shell config.
- `MERGE_ANALYTICS_URL` is CI-only — never exposed to the client.
- The `GET /api/shell` endpoint is read-only and returns only static navigation config; no authentication is required for the current mock implementation.
- Testnet vs mainnet: safe-area utilities are purely presentational and have no network dependency.

## Rollout / Migration Notes

1. **No breaking changes** — `AppShell`, `BottomNav`, and `PageHeader` are drop-in replacements; existing props unchanged.
2. **`viewport-fit=cover`** is additive — on devices without a notch the safe-area env values resolve to `0px` and layout is identical.
3. **`useShell` hook** can be integrated into any client component that needs to read nav config (e.g. animated drawer, breadcrumb). It fetches lazily on mount.
4. `ShellService` has no DB dependency; replacing `getNavItems()` with a DB read requires only changing `shell.service.ts`.

## QA Checklist

- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm run test:unit -- --testPathPattern="safe-area|shell.service"` — all pass
- [ ] `npm run test:component -- --testPathPattern="page-header-a11y"` — all pass
- [ ] `npm run test:a11y` — existing suite still passes
- [ ] `npm run test:integration -- --testPathPattern="shell-api"` — all pass
- [ ] `npx playwright test tests/e2e/app-shell-a11y.spec.ts` — all pass
- [ ] On a notched iOS device (or Chrome DevTools "iPhone 14 Pro"): bottom nav clears home indicator
- [ ] Skip link becomes visible on Tab key press
- [ ] All bottom-nav links announce their name correctly via VoiceOver/NVDA
- [ ] PageHeader back button announces "Go back"
- [ ] CI merge-analytics payload includes `16` in the `issues` array
