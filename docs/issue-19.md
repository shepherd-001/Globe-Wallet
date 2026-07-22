# Issue #19: Enterprise-grade Clarity, Testability & Cross-cutting Integration

## Design Rationale

This issue upgrades the Globe Wallet codebase with enterprise-grade enhancements across multiple layers:

1. **Type System Expansion** — New interfaces (`MergeAnalyticsConfig`, `TestEnvironmentConfig`, `CIWorkflowStep`, `MergeAnalyticsPayloadV2`, `HealthCheckResponse`, `PaginatedResponse<T>`) added to `lib/types.ts` for better type safety across CI/CD and monitoring concerns.

2. **Health Check API** — A new `/api/health` endpoint provides service status monitoring, essential for Kubernetes liveness/readiness probes and CI/CD pipeline validation.

3. **Analytics Service** — `lib/services/analytics.service.ts` centralizes merge-analytics posting logic with retry handling, timeout support, and pure-function payload builders.

4. **Accessible Input Enhancement** — `components/ui/input.tsx` now supports `label`, `hint`, `aria-required`, auto-generated IDs via `useId()`, and improved error state handling.

5. **Test Coverage Dashboard Component** — `components/dashboard/TestCoverageCard.tsx` provides at-a-glance CI test coverage status with pass/fail/pending states.

6. **Analytics Hook** — `hooks/useAnalytics.ts` gives React components a clean interface for posting merge analytics and formatting workflow summaries.

7. **CI Pipeline Updates** — `.github/workflows/ci.yml` includes Issue #19-specific test steps and updated the merge-analytics payload to include issue 19.

8. **Lockfile Alignment** — Removed `package-lock.json` to align with pnpm usage (the project uses `pnpm install` as its package manager).

## API Contracts

### GET /api/health

**Response (200):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 12345,
  "services": {
    "api": "up",
    "mockDb": "up"
  }
}
```

### POST {MERGE_ANALYTICS_URL}

**Request Body:**
```json
{
  "event": "merge",
  "repository": "owner/repo",
  "branch": "main",
  "commit": "abc123",
  "timestamp": "2024-06-20T12:00:00.000Z",
  "author": "developer",
  "issue": 19,
  "issues": [14, 19, 21, 23],
  "status": "success",
  "coverage_verified": true,
  "fixture_coverage_verified": true,
  "accessibility_verified": true,
  "test_count": 42,
  "pass_count": 40,
  "fail_count": 2
}
```

**Response:** `200 OK` on success

## Files Modified

| File | Change |
|------|--------|
| `lib/types.ts` | Added 6 new interfaces/types |
| `app/api/health/route.ts` | **NEW** Health check endpoint |
| `lib/services/analytics.service.ts` | **NEW** Analytics posting service |
| `components/ui/input.tsx` | Enhanced with label, hint, aria-required, useId() |
| `components/dashboard/TestCoverageCard.tsx` | **NEW** Coverage status card component |
| `hooks/useAnalytics.ts` | **NEW** Analytics hook |
| `.github/workflows/ci.yml` | Added Issue #19 test steps |
| `.gitignore` | Added `/issues.md` |
| `package-lock.json` | **REMOVED** (align with pnpm) |

## Test Instructions

### Unit Tests
```bash
npx jest tests/unit/analytics.service.test.ts
```

### Component Tests
```bash
npx jest tests/component/TestCoverageCard.test.tsx
```

### Integration Tests
```bash
npx jest tests/integration/health-api.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- --grep "Health Check API"
```

### All Tests
```bash
npm test
```

## Test Matrix

| Layer | File | Coverage Target |
|-------|------|----------------|
| Unit | `tests/unit/analytics.service.test.ts` | >90% |
| Component | `tests/component/TestCoverageCard.test.tsx` | >90% |
| Integration | `tests/integration/health-api.test.ts` | >75% |
| E2E | `tests/e2e/health-check.spec.ts` | N/A (happy path) |

## Rollout / Migration Notes

1. This change is backward-compatible — no existing interfaces or contracts are broken.
2. The health endpoint is additive and does not affect existing API routes.
3. `MERGE_ANALYTICS_URL` must be configured as a repository secret for the analytics POST to work. See [GitHub Secrets documentation](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions).
4. If NPM was previously used locally, run `pnpm install` after removing `package-lock.json` to generate `pnpm-lock.yaml`.

## Security Notes

- No private keys or secrets are included in any code or documentation.
- The `MERGE_ANALYTICS_URL` is configured via environment variables / GitHub secrets.
- The analytics payload contains only metadata (repo name, branch, commit SHA, status counts) — no user data or credentials.
- The health check endpoint exposes only basic service status information; no sensitive internal details are revealed.

## QA Checklist

- [ ] All unit tests pass (`npx jest tests/unit/analytics.service.test.ts`)
- [ ] All component tests pass (`npx jest tests/component/TestCoverageCard.test.tsx`)
- [ ] All integration tests pass (`npx jest tests/integration/health-api.test.ts`)
- [ ] E2E health check test passes (`npm run test:e2e -- --grep "Health Check API"`)
- [ ] No TypeScript compilation errors (`npm run build` or `npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] `issues.md` is in `.gitignore` and not tracked
- [ ] `package-lock.json` is removed and not tracked
- [ ] Documentation at `docs/issue-19.md` is complete
