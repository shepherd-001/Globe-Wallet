/**
 * tests/component/TestCoverageCard.test.tsx
 * Issue #19: Component tests for TestCoverageCard.
 * Verifies accessibility attributes, status rendering, and progress display.
 */

import { render, screen } from "@testing-library/react"
import { TestCoverageCard } from "@/components/dashboard/TestCoverageCard"

describe("TestCoverageCard", () => {
  it("should render the title", () => {
    render(
      <TestCoverageCard
        title="Unit Tests"
        coverage={92}
        threshold={90}
        status="pass"
      />,
    )

    expect(screen.getByText("Unit Tests")).toBeInTheDocument()
  })

  it("should display coverage percentage", () => {
    render(
      <TestCoverageCard
        title="Integration Tests"
        coverage={85}
        threshold={80}
        status="pass"
      />,
    )

    expect(screen.getByText("85%")).toBeInTheDocument()
  })

  it("should display the threshold value", () => {
    render(
      <TestCoverageCard
        title="E2E Tests"
        coverage={70}
        threshold={75}
        status="fail"
      />,
    )

    expect(screen.getByText("Threshold: 75%")).toBeInTheDocument()
  })

  it("should show passing status when status is pass", () => {
    render(
      <TestCoverageCard
        title="Unit Tests"
        coverage={95}
        threshold={90}
        status="pass"
      />,
    )

    expect(screen.getByText("Passing")).toBeInTheDocument()
  })

  it("should show failing status when status is fail", () => {
    render(
      <TestCoverageCard
        title="E2E Tests"
        coverage={60}
        threshold={75}
        status="fail"
      />,
    )

    expect(screen.getByText("Failing")).toBeInTheDocument()
  })

  it("should show pending status when status is pending", () => {
    render(
      <TestCoverageCard
        title="A11y Tests"
        coverage={0}
        threshold={90}
        status="pending"
      />,
    )

    expect(screen.getByText("Pending")).toBeInTheDocument()
  })

  it("should show an error alert when status is fail", () => {
    render(
      <TestCoverageCard
        title="Integration Tests"
        coverage={50}
        threshold={80}
        status="fail"
      />,
    )

    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(/coverage below/i)
  })

  it("should NOT show an error alert when status is pass", () => {
    render(
      <TestCoverageCard
        title="Unit Tests"
        coverage={100}
        threshold={90}
        status="pass"
      />,
    )

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("should have accessible progress bar with aria-label", () => {
    render(
      <TestCoverageCard
        title="Unit Tests"
        coverage={88}
        threshold={90}
        status="pass"
      />,
    )

    expect(
      screen.getByRole("progressbar", { name: /Unit Tests coverage at 88%/i }),
    ).toBeInTheDocument()
  })

  it("should round coverage to nearest integer", () => {
    render(
      <TestCoverageCard
        title="Misc"
        coverage={92.7}
        threshold={90}
        status="pass"
      />,
    )

    expect(screen.getByText("93%")).toBeInTheDocument()
  })

  it("should cap coverage at 100", () => {
    render(
      <TestCoverageCard
        title="Overachiever"
        coverage={150}
        threshold={90}
        status="pass"
      />,
    )

    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("should have test IDs for testing", () => {
    render(
      <TestCoverageCard
        title="Unit Tests"
        coverage={90}
        threshold={90}
        status="pass"
      />,
    )

    expect(
      screen.getByTestId("coverage-card-unit-tests"),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId("coverage-status-unit-tests"),
    ).toBeInTheDocument()
  })
})
