import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { A11Y_MAIN_PAGES } from "../../lib/a11y/pages";

const CRITICAL_ROUTES = A11Y_MAIN_PAGES.filter((page) => page.critical).map((page) => page.path);

test.describe("Issue #24 — Accessibility E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  for (const route of CRITICAL_ROUTES) {
    test(`no WCAG violations on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });
  }

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("skip-to-main")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("send form failure path remains accessible", async ({ page }) => {
    await page.goto("/send");
    await page.getByLabel("Recipient Address").fill("invalid-address");
    await page.getByLabel("Amount").fill("100");
    await page.getByTestId("review-button").click();
    await expect(page.getByTestId("send-error")).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations, formatViolations(results.violations)).toEqual([]);
  });
});

function formatViolations(violations: Array<{ id: string; impact?: string; description: string }>): string {
  if (violations.length === 0) {
    return "";
  }
  return violations
    .map((v, i) => `${i + 1}. [${v.impact}] ${v.id}: ${v.description}`)
    .join("\n");
}
