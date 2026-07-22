import {
  filterViolationsByImpact,
  formatViolationReport,
  normalizeImpact,
  sortViolationsByImpact,
  summarizeViolations,
  validateAuditPath,
} from "@/lib/a11y/audit-utils";
import { A11Y_MAIN_PAGES, getCriticalPagePaths, getPageConfig } from "@/lib/a11y/pages";
import type { A11yViolation } from "@/lib/types";

describe("a11y audit-utils (Issue #24)", () => {
  const sampleViolations: A11yViolation[] = [
    {
      id: "color-contrast",
      impact: "serious",
      description: "Elements must have sufficient color contrast",
      help: "Fix contrast",
      helpUrl: "https://example.com/contrast",
      nodes: [{ html: "<p />", target: ".muted" }],
    },
    {
      id: "label",
      impact: "critical",
      description: "Form elements must have labels",
      help: "Add labels",
      helpUrl: "https://example.com/label",
      nodes: [{ html: "<input />", target: "#amount" }],
    },
    {
      id: "region",
      impact: "moderate",
      description: "Page should contain a landmark region",
      help: "Add landmarks",
      helpUrl: "https://example.com/region",
      nodes: [],
    },
  ];

  describe("normalizeImpact", () => {
    it("returns known impact levels unchanged", () => {
      expect(normalizeImpact("critical")).toBe("critical");
      expect(normalizeImpact("minor")).toBe("minor");
    });

    it("returns unknown for invalid values", () => {
      expect(normalizeImpact("invalid")).toBe("unknown");
      expect(normalizeImpact(null)).toBe("unknown");
    });
  });

  describe("sortViolationsByImpact", () => {
    it("orders violations from critical to minor", () => {
      const sorted = sortViolationsByImpact(sampleViolations);
      expect(sorted.map((v) => v.impact)).toEqual(["critical", "serious", "moderate"]);
    });
  });

  describe("filterViolationsByImpact", () => {
    it("filters to serious and above when minImpact is serious", () => {
      const filtered = filterViolationsByImpact(sampleViolations, "serious");
      expect(filtered).toHaveLength(2);
      expect(filtered.every((v) => v.impact === "critical" || v.impact === "serious")).toBe(true);
    });

    it("returns all violations when minImpact is minor", () => {
      expect(filterViolationsByImpact(sampleViolations, "minor")).toHaveLength(3);
    });
  });

  describe("summarizeViolations", () => {
    it("computes counts and pass status", () => {
      const summary = summarizeViolations(sampleViolations, "/send");
      expect(summary.pagePath).toBe("/send");
      expect(summary.violationCount).toBe(3);
      expect(summary.byImpact.critical).toBe(1);
      expect(summary.byImpact.serious).toBe(1);
      expect(summary.passed).toBe(false);
      expect(summary.scannedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("marks passed when no violations", () => {
      const summary = summarizeViolations([], "/");
      expect(summary.passed).toBe(true);
      expect(summary.violationCount).toBe(0);
    });
  });

  describe("formatViolationReport", () => {
    it("returns friendly message when clean", () => {
      expect(formatViolationReport([])).toBe("No accessibility violations detected.");
    });

    it("formats violations with impact and targets", () => {
      const report = formatViolationReport([sampleViolations[1]]);
      expect(report).toContain("[critical] label");
      expect(report).toContain("#amount");
    });
  });

  describe("validateAuditPath", () => {
    const allowed = A11Y_MAIN_PAGES.map((page) => page.path);

    it("accepts scoped paths", () => {
      expect(validateAuditPath("/send", allowed)).toBeNull();
    });

    it("rejects empty or invalid paths", () => {
      expect(validateAuditPath("", allowed)).toBe("Path is required");
      expect(validateAuditPath("send", allowed)).toBe("Path must start with /");
      expect(validateAuditPath("/unknown", allowed)).toContain("not in the accessibility audit scope");
    });
  });
});

describe("a11y pages config (Issue #24)", () => {
  it("includes all main wallet routes", () => {
    const paths = A11Y_MAIN_PAGES.map((page) => page.path);
    expect(paths).toEqual(["/", "/send", "/receive", "/convert", "/off-ramp", "/savings", "/cards", "/profile"]);
  });

  it("returns page config by path", () => {
    expect(getPageConfig("/send")?.label).toBe("Send Money");
    expect(getPageConfig("/missing")).toBeUndefined();
  });

  it("lists critical paths", () => {
    expect(getCriticalPagePaths()).toEqual(["/", "/send", "/receive", "/convert", "/off-ramp"]);
  });
});
