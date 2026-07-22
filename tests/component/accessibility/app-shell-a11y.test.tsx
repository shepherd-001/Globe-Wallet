/**
 * Component accessibility tests — Issue #24
 * Validates skip link, landmarks, and axe compliance for shell components.
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { AppShell } from "@/components/app/app-shell";
import { SkipLink } from "@/components/ui/skip-link";
import { A11Y_MAIN_CONTENT_ID } from "@/lib/a11y/pages";

jest.mock("../../../components/app/bottom-nav", () => ({
  BottomNav: () => <nav aria-label="Main navigation" data-testid="bottom-nav-mock" />,
}));

describe("Accessibility components (Issue #24)", () => {
  describe("SkipLink", () => {
    it("renders a skip link targeting main content", () => {
      render(<SkipLink />);
      const link = screen.getByTestId("skip-to-main");
      expect(link).toHaveAttribute("href", `#${A11Y_MAIN_CONTENT_ID}`);
      expect(link).toHaveTextContent("Skip to main content");
    });

    it("has no axe violations", async () => {
      const { container } = render(<SkipLink />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("AppShell", () => {
    it("wraps content in a main landmark with skip link", () => {
      render(
        <AppShell>
          <h1>Dashboard</h1>
        </AppShell>,
      );

      expect(screen.getByTestId("skip-to-main")).toBeInTheDocument();
      const main = document.getElementById(A11Y_MAIN_CONTENT_ID);
      expect(main?.tagName).toBe("MAIN");
      expect(main).toHaveTextContent("Dashboard");
    });

    it("has no axe violations for shell structure", async () => {
      const { container } = render(
        <AppShell>
          <section aria-label="Wallet overview">
            <h1>Wallet</h1>
            <p>Balance overview</p>
          </section>
        </AppShell>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
