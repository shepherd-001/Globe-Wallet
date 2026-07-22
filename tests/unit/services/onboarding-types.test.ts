/**
 * Unit tests for onboarding type contracts — issue #29
 * Validates shape, completeness helpers, and type guards.
 */
import type { OnboardingChecklist, OnboardingStep, DeveloperProfile } from '../../../lib/types'

// ── helper functions being tested ─────────────────────────────────────────────

const ALL_STEPS: OnboardingStep[] = [
  'repo-cloned',
  'env-configured',
  'dev-server-started',
  'tests-run',
  'first-pr-opened',
  'docs-read',
]

function isOnboardingComplete(checklist: OnboardingChecklist): boolean {
  return ALL_STEPS.every((step) => checklist.completedSteps.includes(step))
}

function getNextStep(checklist: OnboardingChecklist): OnboardingStep | null {
  return ALL_STEPS.find((step) => !checklist.completedSteps.includes(step)) ?? null
}

function createChecklist(developer: string): OnboardingChecklist {
  return {
    developer,
    completedSteps: [],
    startedAt: new Date().toISOString(),
  }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('OnboardingChecklist helpers', () => {
  it('creates a checklist with empty steps', () => {
    const c = createChecklist('@alice')
    expect(c.developer).toBe('@alice')
    expect(c.completedSteps).toHaveLength(0)
    expect(c.completedAt).toBeUndefined()
  })

  it('isOnboardingComplete returns false for empty checklist', () => {
    const c = createChecklist('@bob')
    expect(isOnboardingComplete(c)).toBe(false)
  })

  it('isOnboardingComplete returns true when all steps are done', () => {
    const c: OnboardingChecklist = {
      developer: '@carol',
      completedSteps: [...ALL_STEPS],
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }
    expect(isOnboardingComplete(c)).toBe(true)
  })

  it('getNextStep returns the first incomplete step', () => {
    const c: OnboardingChecklist = {
      developer: '@dave',
      completedSteps: ['repo-cloned', 'env-configured'],
      startedAt: new Date().toISOString(),
    }
    expect(getNextStep(c)).toBe('dev-server-started')
  })

  it('getNextStep returns null when all steps are complete', () => {
    const c: OnboardingChecklist = {
      developer: '@eve',
      completedSteps: [...ALL_STEPS],
      startedAt: new Date().toISOString(),
    }
    expect(getNextStep(c)).toBeNull()
  })

  it('does not mutate the original completedSteps array', () => {
    const c = createChecklist('@frank')
    const original = c.completedSteps
    // simulate adding a step via spread
    const updated: OnboardingChecklist = {
      ...c,
      completedSteps: [...c.completedSteps, 'repo-cloned'],
    }
    expect(original).toHaveLength(0)
    expect(updated.completedSteps).toHaveLength(1)
  })
})

describe('DeveloperProfile type', () => {
  const profiles: DeveloperProfile[] = [
    { handle: '@alice', role: 'frontend', advancedMode: false },
    { handle: '@bob', role: 'backend', advancedMode: true },
    { handle: '@carol', role: 'fullstack', advancedMode: false },
    { handle: '@dave', role: 'qa', advancedMode: false },
    { handle: '@eve', role: 'devops', advancedMode: true },
  ]

  it('accepts all valid roles', () => {
    profiles.forEach((p) => {
      expect(['frontend', 'backend', 'fullstack', 'qa', 'devops']).toContain(p.role)
    })
  })

  it('handle is a non-empty string', () => {
    profiles.forEach((p) => {
      expect(typeof p.handle).toBe('string')
      expect(p.handle.length).toBeGreaterThan(0)
    })
  })

  it('advancedMode is a boolean', () => {
    profiles.forEach((p) => {
      expect(typeof p.advancedMode).toBe('boolean')
    })
  })
})
