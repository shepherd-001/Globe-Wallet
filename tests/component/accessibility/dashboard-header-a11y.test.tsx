/**
 * Dashboard Header accessibility — Issue #24
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Header } from "@/components/dashboard/header";

jest.mock("../../../components/dashboard/mobile-nav", () => ({
  MobileNav: () => <button type="button" aria-label="Open menu">Menu</button>,
}));

jest.mock("../../../components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button" aria-label="Toggle theme">Theme</button>,
}));

describe("Dashboard Header accessibility (Issue #24)", () => {
  it("labels icon-only action buttons", () => {
    render(<Header title="Dashboard" description="Overview" />);
    expect(screen.getByRole("button", { name: "Open messages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View notifications" })).toBeInTheDocument();
  });

  it("labels the search input", () => {
    render(<Header title="Dashboard" description="Overview" />);
    expect(screen.getByRole("textbox", { name: "Search tasks" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Header title="Dashboard" description="Wallet overview" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
