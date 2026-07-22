# Issue #29 — Developer Onboarding: Repo Structure & Conventions

## Overview

This document is the canonical onboarding reference for new contributors to **Globe Wallet**. It covers the project architecture, folder conventions, service patterns, testing strategy, security notes, and how to run/contribute to the codebase.

Cross-references:
- [Architecture deep-dive](./architecture.md)
- [Enterprise service layer (Issue #27)](./issue-27.md)
- [Send form & contact picker (Issue #23)](./issue-23.md)

---

## Table of Contents

1. [What is Globe Wallet?](#1-what-is-globe-wallet)
2. [Tech Stack at a Glance](#2-tech-stack-at-a-glance)
3. [Repository Structure](#3-repository-structure)
4. [Architecture & Layering](#4-architecture--layering)
5. [Key Conventions](#5-key-conventions)
6. [Service Layer Guide](#6-service-layer-guide)
7. [Hooks Layer Guide](#7-hooks-layer-guide)
8. [Component Guide](#8-component-guide)
9. [API Routes](#9-api-routes)
10. [Type System](#10-type-system)
11. [Testing Strategy](#11-testing-strategy)
12. [CI/CD Pipeline](#12-cicd-pipeline)
13. [Environment Setup](#13-environment-setup)
14. [Security & Key Handling](#14-security--key-handling)
15. [Contributing Workflow](#15-contributing-workflow)
16. [Definition of Done Checklist](#16-definition-of-done-checklist)

---

## 1. What is Globe Wallet?

Globe Wallet is a **mobile-first, multi-currency financial application** settled on the [Stellar Network](https://stellar.org). It lets users send and receive XLM, convert between digital and fiat currencies, track savings goals, and off-ramp to bank accounts — all in a single Progressive Web App.

Core capabilities:

- **Send / Receive XLM and tokens** (USDC, USDT) with QR code support
- **Currency conversion** via Stellar DEX path payments
- **Off-ramp** from crypto to fiat (NGN, USD, GBP, EUR)
- **Savings goals** with APY tracking
- **Payment card management** (virtual & physical)
- **Multi-currency wallet dashboard**

The app targets users in emerging markets (especially Africa) where borderless payments matter.

---

## 2. Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 + Shadcn/UI |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Charts | Recharts |
| Notifications | Sonner |
| QR Codes | qrcode.react |
| Unit / Component Tests | Jest 29 + @testing-library/react |
| Property Tests | fast-check |
| E2E Tests | Playwright |
| CI | GitHub Actions |
| Analytics | @vercel/analytics |

---

## 3. Repository Structure

```
Globe-Wallet/
├── app/                      # Next.js App Router — pages & API routes
│   ├── api/                  # Route handlers (GET/POST per resource)
│   │   ├── assets/           # GET /api/assets
│   │   ├── rates/            # GET /api/rates
│   │   ├── send/             # POST /api/send
│   │   ├── stellar/          # GET /api/stellar (account info)
│   │   └── wallet/
│   │       ├── balances/     # GET /api/wallet/balances
│   │       ├── send/         # POST /api/wallet/send
│   │       └── transactions/ # GET /api/wallet/transactions
│   ├── (routes)/             # Page routes: send, receive, convert, off-ramp, etc.
│   ├── layout.tsx            # Root HTML shell, ThemeProvider, Analytics
│   ├── page.tsx              # Home dashboard
│   └── globals.css           # Tailwind base styles
│
├── components/
│   ├── app/                  # Feature components (balance-card, send-form, etc.)
│   ├── dashboard/            # Dashboard-specific layout components
│   ├── finance/              # Legacy finance display components
│   ├── ui/                   # Shadcn/UI primitive components (48+ files)
│   ├── theme-provider.tsx    # next-themes wrapper
│   └── theme-toggle.tsx      # Dark/light toggle button
│
├── hooks/                    # Custom React hooks — service abstraction layer
│   ├── useFinanceServices.ts # Root context + domain hooks (useWallet, usePricing…)
│   ├── useBalances.ts        # Aggregate fiat + crypto balance state
│   ├── useContacts.ts        # Contact search & selection
│   ├── useTransactions.ts    # Transaction history with filtering
│   ├── useWalletSend.ts      # Send flow state machine
│   ├── useErrorBoundary.ts   # Error capture & recovery helper
│   ├── use-mobile.ts         # Responsive breakpoint (768 px)
│   └── use-toast.ts          # Toast notification interface
│
├── lib/
│   ├── types.ts              # All TypeScript interfaces, domain models, error classes
│   ├── finance-data.ts       # Seed data & formatting utilities
│   ├── utils.ts              # cn() Tailwind class merge helper
│   ├── services/             # Pure TypeScript service classes
│   │   ├── base.service.ts   # Abstract base: error handling, perf tracking
│   │   ├── container.ts      # FinanceServiceContainer (DI root)
│   │   ├── wallet.service.ts
│   │   ├── exchange.service.ts
│   │   ├── off-ramp.service.ts
│   │   ├── pricing.service.ts
│   │   ├── fiat.service.ts
│   │   ├── soroban.service.ts
│   │   ├── asset.service.ts
│   │   ├── stellar.service.ts
│   │   └── contact.service.ts
│   ├── helpers/
│   │   └── format.ts         # Pure formatting & validation utilities
│   ├── db/
│   │   └── mock-db.ts        # In-memory transaction persistence (test/dev)
│   ├── api/
│   │   └── wallet-client.ts  # Typed fetch wrappers for API routes
│   └── migration/
│       └── legacy-adapter.ts # Bridge for pre-refactor data shapes
│
├── tests/
│   ├── unit/
│   │   ├── services/         # Service class unit tests
│   │   └── hooks/            # Hook unit tests
│   ├── component/            # React Testing Library component tests
│   ├── integration/          # UI → API route integration tests (mocked fetch)
│   ├── e2e/                  # Playwright end-to-end specs
│   └── property/             # fast-check property-based tests
│
├── docs/                     # Design rationale, API contracts, issue specs
├── public/                   # Static assets (icons, images)
├── .github/workflows/        # CI/CD pipeline definitions
├── jest.config.js            # Jest configuration (coverage thresholds)
├── jest.setup.js             # Test environment polyfills
├── playwright.config.ts      # Playwright browser matrix
├── next.config.mjs           # Next.js configuration
├── tsconfig.json             # TypeScript compiler options
└── package.json              # Scripts and dependencies
```

### Key rules

- **Never put business logic in components.** Components call hooks; hooks call services.
- **Never import services directly in components.** Always go through a hook.
- **Never hardcode secrets.** Use `.env.local` (see [Section 14](#14-security--key-handling)).

---

## 4. Architecture & Layering

The app follows a strict 4-layer architecture:

```
┌──────────────────────────────────────┐
│  Presentation Layer                  │
│  components/app/* + components/ui/*  │
│  Renders UI, handles user events     │
└──────────────┬───────────────────────┘
               │ calls hooks only
┌──────────────▼───────────────────────┐
│  Abstraction Layer (Hooks)           │
│  hooks/*                             │
│  Reactive bridge: service → React    │
│  Manages loading/error/isProcessing  │
└──────────────┬───────────────────────┘
               │ calls service interfaces
┌──────────────▼───────────────────────┐
│  Service Layer                       │
│  lib/services/*                      │
│  Pure TypeScript, stateless          │
│  Implements typed interfaces         │
└──────────────┬───────────────────────┘
               │ reads/writes
┌──────────────▼───────────────────────┐
│  Data Layer                          │
│  app/api/* + lib/db/mock-db.ts       │
│  API route handlers + mock DB        │
└──────────────────────────────────────┘
```

### Why this matters

- **Services are stateless** → easy to unit test in isolation.
- **Hooks own loading/error state** → services don't need React.
- **Components are pure presenters** → easy to snapshot and test with Testing Library.
- **`FinanceServiceContainer` is injectable** → swap real services for mocks in tests without patching `global.fetch`.

---

## 5. Key Conventions

### 5.1 Naming

| Thing | Convention | Example |
|---|---|---|
| Service class | `<Domain>Service` | `WalletService` |
| Service interface | `I<Domain>Service` | `IWalletService` |
| Hook | `use<Feature>` | `useWalletSend` |
| Component file | `kebab-case.tsx` | `send-form.tsx` |
| Component export | `PascalCase` | `export function SendForm()` |
| API route file | `app/api/<resource>/route.ts` | `app/api/wallet/send/route.ts` |
| Type/interface | PascalCase, no `T` prefix | `Transaction`, `SendRequest` |
| Error class | `<Domain>ServiceError` | `WalletServiceError` |
| Test file | `<subject>.test.ts(x)` | `wallet.service.test.ts` |
| E2E spec | `<flow>.spec.ts` | `send-flow.spec.ts` |

### 5.2 Imports

Always use the `@/` path alias (maps to repo root):

```typescript
// ✅ correct
import { useWallet } from '@/hooks/useFinanceServices'
import { Card } from '@/components/ui/card'
import type { AssetCode } from '@/lib/types'

// ❌ avoid
import { useWallet } from '../../hooks/useFinanceServices'
```

### 5.3 TypeScript

- `strict: true` is enforced — no implicit `any`.
- Prefer domain types over primitives: use `AssetCode` not `string` for asset codes.
- All service method signatures are defined in `lib/types.ts` interfaces first.
- Use `type` for unions/aliases, `interface` for object shapes.

### 5.4 Async / Error handling

```typescript
// Services throw typed errors
throw new WalletServiceError('Amount must be greater than zero')

// Hooks catch and convert to UI state
try {
  const result = await wallet.sendPayment(dest, amount, asset)
  setResult(result)
  setStatus('success')
} catch (e) {
  setError(e instanceof Error ? e.message : 'Unexpected error')
  setStatus('error')
}

// Components render status, never catch service errors directly
{status === 'error' && <WalletErrorAlert message={error} />}
```

### 5.5 Styling

- Use `cn()` from `lib/utils.ts` for conditional Tailwind classes.
- Follow mobile-first responsive design (`sm:`, `md:`, `lg:` prefixes).
- Use CSS variables via Tailwind config for theme colors (`text-primary`, `bg-background`, etc.).
- Dark/light theme is handled by `ThemeProvider` — never hardcode `#hex` colors in components.

---

## 6. Service Layer Guide

### Creating a new service

1. Define the interface in `lib/types.ts`:

```typescript
export interface IMyService {
  doSomething(input: string): Promise<MyResult>
}
```

2. Create `lib/services/my.service.ts` extending `BaseService`:

```typescript
import { BaseService } from './base.service'
import { IMyService, MyResult, ServiceError } from '../types'

export class MyService extends BaseService implements IMyService {
  constructor() {
    super('MyService')
  }

  async doSomething(input: string): Promise<MyResult> {
    return this.withPerformanceTracking('doSomething', async () => {
      try {
        // business logic here
        return { value: input.trim() }
      } catch (err) {
        this.handleError(err, 'doSomething')
      }
    })
  }
}
```

3. Register in `lib/services/container.ts`:

```typescript
import { MyService } from './my.service'

export class FinanceServiceContainer {
  public readonly my: IMyService
  constructor(myService?: IMyService) {
    this.my = myService ?? new MyService()
  }
}
```

4. Expose via a hook in `hooks/useFinanceServices.ts`:

```typescript
export function useMyFeature() {
  const { my } = useFinanceServices()
  return {
    doSomething: (input: string) => my.doSomething(input),
  }
}
```

### Error codes reference

| Code | Class | Trigger | UI treatment |
|---|---|---|---|
| `ERR_INVALID_ADDRESS` | `StellarServiceError` | Bad Stellar key format | Inline red error under address field |
| `ERR_INSUFFICIENT_FUNDS` | `WalletServiceError` | Balance < amount + fee | "Insufficient Balance" alert |
| `ERR_NETWORK_TIMEOUT` | `StellarServiceError` | Horizon unreachable | Retry button + toast |
| `ERR_SLIPPAGE_EXCEEDED` | `ExchangeServiceError` | Price moved during swap | "Refresh Quote" prompt |

---

## 7. Hooks Layer Guide

Hooks live in `hooks/` and are the **only** way components interact with services.

### `useFinanceServices()`

Returns the full `IFinanceServiceContainer`. Do not use this directly in components — use the domain-specific hooks:

| Hook | Wraps | Key returns |
|---|---|---|
| `useWallet()` | `IWalletService` | `sendPayment`, `getBalance`, `validateAddress`, `isProcessing` |
| `useWallets()` | `IFiatService` | `getWallets`, `formatMoney`, `convertCurrency` |
| `usePricing()` | `IPricingService` | `getAssets`, `getPrice`, `formatAsset` |
| `useExchange()` | `IExchangeService` | `estimate`, `execute` |
| `useOffRamp()` | `IOffRampService` | `initiate`, `getRates`, `getMethods` |
| `useSoroban()` | `ISorobanService` | `createGoal`, `stake` |
| `useBalances()` | `IFiatService` + `IPricingService` | `wallets`, `assets`, `totalFiatValue`, `loading` |
| `useTransactions()` | `IWalletService` | `getTransactions`, `getTransactionsByCategory` |
| `useContacts()` | `ContactService` | `contacts`, `selected`, `query`, `setQuery`, `select` |
| `useWalletSend()` | `IWalletService` | `send`, `status`, `isProcessing`, `error`, `result`, `reset` |

### Injecting mock services in tests

```tsx
import { FinanceServicesProvider } from '@/hooks/useFinanceServices'

const mockContainer = {
  wallet: { sendPayment: jest.fn().mockResolvedValue({ success: true }) },
  pricing: { getAssets: jest.fn().mockReturnValue([]) },
  // ...
}

render(
  <FinanceServicesProvider services={mockContainer as any}>
    <MyComponent />
  </FinanceServicesProvider>
)
```

---

## 8. Component Guide

### Feature components (`components/app/`)

Each file exports a single named React component. Components should:

- Accept minimal props (prefer reading state from hooks)
- Use `data-testid` attributes on interactive elements for test targeting
- Use semantic HTML and ARIA attributes for accessibility
- Never import services directly

Key components:

| Component | Purpose |
|---|---|
| `AppShell` | Root mobile layout wrapper with `BottomNav` |
| `BalanceCard` | Primary balance display |
| `CryptoHoldings` | Portfolio asset list |
| `TransactionList` | Recent activity feed |
| `SendForm` | Two-step send flow (address → review → confirm) |
| `QuickActions` | Send, Request, Airtime, Bills shortcuts |
| `PageHeader` | Sticky back navigation + title |

### UI primitives (`components/ui/`)

These are Shadcn/UI components — treat them as a design system. Do not edit them unless upgrading the design system. New primitives should be added via `npx shadcn add <component>`.

### Adding a new feature component

```tsx
// components/app/my-feature.tsx
'use client'

import { useMyFeature } from '@/hooks/useFinanceServices'

export function MyFeature() {
  const { doSomething } = useMyFeature()
  return (
    <div data-testid="my-feature">
      {/* ... */}
    </div>
  )
}
```

---

## 9. API Routes

API routes live in `app/api/<resource>/route.ts` and follow the Next.js App Router convention.

### Pattern

```typescript
// app/api/my-resource/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { myService } from '@/lib/services/my.service'

export async function GET(request: NextRequest) {
  try {
    const data = await myService.getData()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
```

### Existing routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/assets` | All crypto assets with prices |
| `GET` | `/api/rates` | Fiat/crypto conversion rates |
| `GET` | `/api/stellar` | Stellar account info |
| `POST` | `/api/send` | Initiate a payment (`SendRequest` → `SendResponse`) |
| `GET` | `/api/wallet/balances` | Multi-asset balances |
| `POST` | `/api/wallet/send` | Internal send handler (called by `WalletService`) |
| `GET` | `/api/wallet/transactions` | Transaction history |

### Request / Response types

All request and response shapes are defined in `lib/types.ts`. Always import from there:

```typescript
import type { SendRequest, SendResponse } from '@/lib/types'
```

---

## 10. Type System

All domain types, interfaces, and error classes live in `lib/types.ts`. This is the **single source of truth**.

### Core domain models

```
StellarAccount  — Stellar public key, network, funded status
Wallet          — Fiat wallet (NGN/USD/GBP/EUR) with balance
CryptoAsset     — Token (XLM/USDC/USDT) with price and 24h change
Transaction     — Send/receive/convert event
Contact         — Address book entry
SavingsGoal     — Savings target with APY
PaymentCard     — Virtual or physical card
Balance         — Asset + amount + USD price (from WalletService)
```

### AssetCode vs CurrencyCode

```typescript
type AssetCode    = 'XLM' | 'USDC' | 'USDT' | 'NGN' | 'USD' | 'EUR'
type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP'
```

Use `AssetCode` for crypto-layer operations (services, hooks). Use `CurrencyCode` for fiat-layer formatting.

### Error hierarchy

```
Error
└── ServiceError
    ├── StellarServiceError
    ├── WalletServiceError
    ├── ExchangeServiceError
    ├── OffRampServiceError
    ├── AssetServiceError
    └── FiatServiceError
```

---

## 11. Testing Strategy

### Test matrix

| Type | Tool | Location | Target coverage |
|---|---|---|---|
| Unit | Jest | `tests/unit/` | >90% of changed `lib/` and `hooks/` |
| Component | Jest + RTL | `tests/component/` | All interactive components |
| Integration | Jest | `tests/integration/` | UI → API route happy/sad path |
| E2E | Playwright | `tests/e2e/` | Critical user flows |
| Property | fast-check | `tests/property/` | Edge cases in pure functions |

### Running tests

```bash
# All unit tests
npm run test:unit

# All component tests
npm run test:component

# Integration tests (mocked API)
npm run test:integration

# E2E tests (requires dev server on :3000)
npm run test:e2e

# Coverage report (must hit 90% threshold)
npm run test:coverage
```

### Test file naming

- Unit: `tests/unit/services/<name>.test.ts`
- Hooks: `tests/unit/hooks/<name>.test.ts`
- Component: `tests/component/<ComponentName>.test.tsx`
- Integration: `tests/integration/<flow>.test.tsx`
- E2E: `tests/e2e/<flow>.spec.ts`

### Mocking services

Always inject mock containers via `FinanceServicesProvider`. Never mock `global.fetch` to test service logic — test the service in a unit test instead.

### Accessibility in tests

Use `screen.getByRole()` as the primary query method. This forces components to use correct ARIA roles and is more resilient than `getByTestId`:

```typescript
screen.getByRole('button', { name: /confirm send/i })
screen.getByRole('form', { name: /send payment form/i })
screen.getByRole('status') // live region for success
```

### E2E conventions

- Specs live in `tests/e2e/` and use `.spec.ts` extension.
- The dev server is started automatically by Playwright config.
- Tag critical flows with `@critical` in the test title if you want to run them in isolation with `--grep`.
- `data-testid` attributes are the fallback for elements that don't have accessible roles.

---

## 12. CI/CD Pipeline

The pipeline is defined in `.github/workflows/ci.yml`.

### Jobs

**`test`** (runs on all pushes and PRs to `main`):
1. Install Node 20 + dependencies
2. `npm run test:unit`
3. `npm run test:component`
4. `npm run test:integration`
5. Install Playwright browsers
6. `npm run test:e2e`

**`merge-analytics`** (runs only on merge to `main`, after `test` passes):
- POSTs a JSON event payload to `${{ secrets.MERGE_ANALYTICS_URL }}`
- Configure the URL in repository Settings → Secrets and variables → Actions

### Adding a new workflow secret

1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `MERGE_ANALYTICS_URL`, Value: your analytics endpoint
4. Reference in YAML as `${{ secrets.MERGE_ANALYTICS_URL }}`

### Branch protection

- `main` requires all CI checks to pass before merge
- PRs must target `main`; work branches should be named `feature/<issue>-<slug>`

---

## 13. Environment Setup

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/Orbit-Wal/Globe-Wallet.git
cd Globe-Wallet
pnpm install
```

### Environment variables

Create `.env.local` in the repo root:

```env
# Stellar network (testnet for development, mainnet for production)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Analytics (optional — only needed in production)
# MERGE_ANALYTICS_URL is a repository secret, not a .env variable
```

> **Do not commit `.env.local`.** It is already in `.gitignore`.

### Running locally

```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm build        # Production build (validates TypeScript)
pnpm lint         # ESLint check
npm run test      # Full Jest suite
npm run test:e2e  # Playwright E2E (starts dev server automatically)
```

---

## 14. Security & Key Handling

### Private keys

- **Never** include Stellar private keys (starting with `S`) in source code, tests, or docs.
- The app is designed for client-side key custody — keys are never sent to the backend.
- For tests, use the Stellar testnet and generate throwaway keypairs.

### Testnet vs Mainnet

- Development uses `NEXT_PUBLIC_STELLAR_NETWORK=testnet` pointing to `horizon-testnet.stellar.org`.
- Production uses Stellar Mainnet via `horizon.stellar.org`.
- The `StellarService` reads this environment variable — never hardcode the network.

### Secrets in CI

- `MERGE_ANALYTICS_URL` is stored as a GitHub Actions secret and is never echoed in logs.
- Do not add secrets to workflow YAML directly. Always reference via `${{ secrets.NAME }}`.

### Dependency safety

- Use exact or pinned versions in `package.json` — avoid `*` or `latest` ranges.
- Run `npm audit` before opening PRs that add new dependencies.
- Flag any unfamiliar package names — typosquatting is a real threat.

### API endpoints

- All API routes validate their inputs before calling services.
- Error responses never expose stack traces or internal paths.
- Rate limiting is the responsibility of the deployment layer (not yet implemented in the app).

---

## 15. Contributing Workflow

```
1. Pick an issue from the backlog
2. Create a branch: git checkout -b feature/29-onboarding
3. Make changes across the required layers
4. Run: npm run test && npm run test:e2e
5. Run: npm run build  (must compile with zero TS errors)
6. Open a PR targeting main
7. Fill in the PR checklist (see below)
8. Request review from relevant leads
```

### PR checklist

- [ ] Code compiles: `npm run build` passes with no TypeScript errors
- [ ] All tests pass: `npm test` and `npm run test:e2e`
- [ ] Coverage stays above 90%: `npm run test:coverage`
- [ ] No private keys or secrets in code or test fixtures
- [ ] New components have `data-testid` and ARIA attributes
- [ ] New services extend `BaseService` and implement a typed interface
- [ ] New hooks consume services via `useFinanceServices()` context
- [ ] `lib/types.ts` updated for any new domain models
- [ ] `docs/` entry added or updated if design decisions were made
- [ ] README cross-links updated if a new doc was added

---

## 16. Definition of Done Checklist

Before marking an issue as done, confirm:

- [ ] Code changes touch the required layers (at minimum: service + hook + component)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Unit tests cover new/changed business logic at >90%
- [ ] Component test covers the primary user interaction
- [ ] Integration test covers the UI → API happy path and at least one failure path
- [ ] E2E test covers the critical user flow end-to-end
- [ ] Documentation added in `docs/issue-<N>.md`
- [ ] `docs/issue-<N>.md` cross-linked from `README.md`
- [ ] CI pipeline passes on the PR branch
- [ ] Merge to `main` triggers analytics POST to `MERGE_ANALYTICS_URL`
- [ ] PR includes a human-readable changelog and testing steps

---

## Rollout & Migration Notes

This document (issue #29) is additive — no breaking changes to the runtime code. The additions are:

1. `docs/issue-29.md` — this file (cross-linked in README)
2. `lib/types.ts` — two new types: `OnboardingChecklist` and `DeveloperProfile`
3. `lib/helpers/format.ts` — `formatRelativeDate` helper
4. `components/app/page-header.tsx` — `data-testid` props for test targeting
5. `components/app/onboarding-banner.tsx` — new dismissible onboarding hint component
6. Tests — unit, component, integration, and E2E covering the above
7. `.github/workflows/ci.yml` — updated analytics payload includes `issue: 29`

No existing services, hooks, or pages are modified in a breaking way.
