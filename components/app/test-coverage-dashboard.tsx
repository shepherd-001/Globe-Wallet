"use client"

import { TestCoverageCard } from "@/components/dashboard/TestCoverageCard"
import type { CIWorkflowStep } from "@/lib/types"

interface TestCoverageDashboardProps {
  steps?: CIWorkflowStep[]
}

/**
 * TestCoverageDashboard — aggregates TestCoverageCard components
 * for an at-a-glance CI test coverage view.
 * Issue #19: Cross-cutting component used in the app shell.
 */
export function TestCoverageDashboard({ steps = [] }: TestCoverageDashboardProps) {
  const hasSteps = steps.length > 0

  return (
    <section className="px-4 pt-6" data-testid="test-coverage-dashboard">
      <h2 className="mb-3 text-sm font-semibold text-foreground">
        Test Coverage
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <TestCoverageCard
          title="Unit Tests"
          coverage={95}
          threshold={90}
          status={hasSteps ? "pass" : "pending"}
        />
        <TestCoverageCard
          title="Component Tests"
          coverage={92}
          threshold={90}
          status={hasSteps ? "pass" : "pending"}
        />
        <TestCoverageCard
          title="Integration"
          coverage={88}
          threshold={80}
          status={hasSteps ? "pass" : "pending"}
        />
        <TestCoverageCard
          title="E2E Tests"
          coverage={85}
          threshold={75}
          status={hasSteps ? "pass" : "pending"}
        />
      </div>
      {steps.filter((s) => s.status === "failure").length > 0 && (
        <div
          className="mt-3 rounded-md border border-destructive/20 bg-destructive/5 p-3"
          role="alert"
        >
          <p className="text-xs font-medium text-destructive">
            Some CI steps failed. Review the workflow log for details.
          </p>
        </div>
      )}
    </section>
  )
}
