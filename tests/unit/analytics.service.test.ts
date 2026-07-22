/**
 * tests/unit/analytics.service.test.ts
 * Issue #19: Unit tests for the analytics service (buildMergePayload, formatWorkflowSummary).
 * Target: >90% coverage for analytics.service.ts
 */

import { buildMergePayload, formatWorkflowSummary } from "@/lib/services/analytics.service"
import type { CIWorkflowStep, MergeAnalyticsPayloadV2 } from "@/lib/types"

describe("AnalyticsService", () => {
  describe("buildMergePayload", () => {
    it("should create a valid payload with required fields", () => {
      const payload = buildMergePayload({
        repository: "owner/repo",
        branch: "main",
        commit: "abc123",
        author: "dev",
        issue: 19,
      })

      expect(payload).toMatchObject({
        event: "merge",
        repository: "owner/repo",
        branch: "main",
        commit: "abc123",
        author: "dev",
        issue: 19,
        issues: [19],
        status: "success",
        coverage_verified: false,
        fixture_coverage_verified: false,
        accessibility_verified: false,
        test_count: 0,
        pass_count: 0,
        fail_count: 0,
      })

      // timestamp should be ISO string
      expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp)
    })

    it("should use default issue list when issues not provided", () => {
      const payload = buildMergePayload({
        repository: "owner/repo",
        branch: "feature/test",
        commit: "def456",
        author: "tester",
        issue: 19,
      })

      expect(payload.issues).toEqual([19])
    })

    it("should include custom issue list when provided", () => {
      const payload = buildMergePayload({
        repository: "owner/repo",
        branch: "feature/test",
        commit: "def456",
        author: "tester",
        issue: 19,
        issues: [14, 19, 21, 23],
      })

      expect(payload.issues).toEqual([14, 19, 21, 23])
    })

    it("should set status to failure when specified", () => {
      const payload = buildMergePayload({
        repository: "owner/repo",
        branch: "main",
        commit: "abc",
        author: "dev",
        issue: 19,
        status: "failure",
      })

      expect(payload.status).toBe("failure")
    })

    it("should include coverage and test result fields", () => {
      const payload = buildMergePayload({
        repository: "owner/repo",
        branch: "main",
        commit: "abc",
        author: "dev",
        issue: 19,
        coverageVerified: true,
        fixtureCoverageVerified: true,
        accessibilityVerified: true,
        testResults: { total: 42, passed: 40, failed: 2 },
      })

      expect(payload.coverage_verified).toBe(true)
      expect(payload.fixture_coverage_verified).toBe(true)
      expect(payload.accessibility_verified).toBe(true)
      expect(payload.test_count).toBe(42)
      expect(payload.pass_count).toBe(40)
      expect(payload.fail_count).toBe(2)
    })
  })

  describe("formatWorkflowSummary", () => {
    const mockSteps: CIWorkflowStep[] = [
      { name: "Lint", status: "success", durationMs: 5000 },
      { name: "Unit Tests", status: "success", durationMs: 12000 },
      { name: "Component Tests", status: "failure", durationMs: 8000 },
      { name: "Build", status: "skipped", durationMs: 0 },
    ]

    it("should return a formatted summary string", () => {
      const summary = formatWorkflowSummary(mockSteps)

      expect(summary).toContain("Workflow completed")
      expect(summary).toContain("2/4 steps passed")
      expect(summary).toContain("1 failed")
      expect(summary).toContain("Total duration")
    })

    it("should include each step's name and status", () => {
      const summary = formatWorkflowSummary(mockSteps)

      expect(summary).toContain("[SUCCESS] Lint")
      expect(summary).toContain("[SUCCESS] Unit Tests")
      expect(summary).toContain("[FAILURE] Component Tests")
      expect(summary).toContain("[SKIPPED] Build")
    })

    it("should calculate total duration correctly", () => {
      const summary = formatWorkflowSummary(mockSteps)

      expect(summary).toContain("25.00s") // 5000 + 12000 + 8000 + 0 = 25000ms
    })

    it("should handle empty steps gracefully", () => {
      const summary = formatWorkflowSummary([])

      expect(summary).toContain("0/0 steps passed")
      expect(summary).toContain("0 failed")
    })

    it("should handle a single step", () => {
      const summary = formatWorkflowSummary([
        { name: "Deploy", status: "success", durationMs: 30000 },
      ])

      expect(summary).toContain("1/1 steps passed")
      expect(summary).toContain("30.00s")
    })
  })
})
