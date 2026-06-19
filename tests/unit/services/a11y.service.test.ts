/** @jest-environment node */
import { a11yService } from "@/lib/services/a11y.service";

describe("A11yService (Issue #24)", () => {
  it("returns configured pages and WCAG standard", () => {
    expect(a11yService.getStandard()).toBe("WCAG2AA");
    expect(a11yService.getPages().length).toBeGreaterThanOrEqual(5);
  });

  it("passes clean pages with no violations", () => {
    const result = a11yService.auditPage({ path: "/" });
    expect(result.success).toBe(true);
    expect(result.summary.passed).toBe(true);
  });

  it("returns mock violations for /send", () => {
    const result = a11yService.auditPage({ path: "/send" });
    expect(result.violations).toHaveLength(1);
    expect(result.summary.passed).toBe(false);
  });

  it("filters violations by minImpact", () => {
    const result = a11yService.auditPage({ path: "/send", minImpact: "critical" });
    expect(result.violations).toHaveLength(0);
    expect(result.summary.passed).toBe(true);
  });

  it("rejects out-of-scope paths", () => {
    const result = a11yService.auditPage({ path: "/settings" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not in the accessibility audit scope");
  });
});
