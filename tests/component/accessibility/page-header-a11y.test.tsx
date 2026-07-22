/**
 * Component accessibility tests — PageHeader (Issue #16)
 * Validates: landmark semantics, back-link label, action group, axe compliance.
 */
import * as React from "react"
import { render, screen } from "@testing-library/react"
import { axe } from "jest-axe"
import { PageHeader } from "@/components/app/page-header"

jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode; [k: string]: unknown }) {
    return <a href={href} {...rest}>{children}</a>
  }
})

describe("PageHeader accessibility (Issue #16)", () => {
  it("renders a header element with descriptive aria-label", () => {
    render(<PageHeader title="Send Money" />)
    const header = screen.getByRole("banner", { hidden: true })
      ?? document.querySelector("header")
    expect(document.querySelector("header")).not.toBeNull()
    expect(document.querySelector("header")?.getAttribute("aria-label")).toContain("Send Money")
  })

  it("back link has a clear aria-label", () => {
    render(<PageHeader title="Send Money" />)
    const backLink = screen.getByTestId("page-header-back")
    expect(backLink).toHaveAttribute("aria-label", "Go back")
  })

  it("back link has focus-visible ring classes", () => {
    render(<PageHeader title="Send Money" />)
    const backLink = screen.getByTestId("page-header-back")
    expect(backLink.className).toContain("focus-visible:ring-2")
  })

  it("renders the page title in an h1", () => {
    render(<PageHeader title="Receive Payment" />)
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toHaveTextContent("Receive Payment")
    expect(heading).toHaveAttribute("data-testid", "page-header-title")
  })

  it("heading gets a deterministic id based on title", () => {
    render(<PageHeader title="Send Money" />)
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.id).toBe("page-title-send-money")
  })

  it("does not render action region when no action provided", () => {
    render(<PageHeader title="Cards" />)
    expect(screen.queryByTestId("page-header-action")).toBeNull()
  })

  it("renders action region with role=group when action provided", () => {
    render(<PageHeader title="Cards" action={<button type="button">Filter</button>} />)
    const actionGroup = screen.getByTestId("page-header-action")
    expect(actionGroup).toHaveAttribute("role", "group")
    expect(actionGroup).toHaveAttribute("aria-label", "Page actions")
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument()
  })

  it("uses custom back href", () => {
    render(<PageHeader title="Profile" back="/settings" />)
    expect(screen.getByTestId("page-header-back")).toHaveAttribute("href", "/settings")
  })

  it("has no axe violations (no action)", async () => {
    const { container } = render(
      <div>
        <PageHeader title="Savings" />
        <main id="main-content">Content</main>
      </div>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it("has no axe violations (with action button)", async () => {
    const { container } = render(
      <div>
        <PageHeader
          title="Cards"
          action={<button type="button" aria-label="Add card">+</button>}
        />
        <main id="main-content">Content</main>
      </div>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
