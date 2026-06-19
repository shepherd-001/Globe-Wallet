import { A11Y_MAIN_PAGES, A11Y_WCAG_STANDARD } from "@/lib/a11y/pages";
import {
  filterViolationsByImpact,
  summarizeViolations,
  validateAuditPath,
} from "@/lib/a11y/audit-utils";
import type {
  A11yAuditRequest,
  A11yAuditResponse,
  A11yImpactLevel,
  A11yPageConfig,
  A11yViolation,
  IA11yService,
} from "@/lib/types";

/** Mock violation catalog used by integration tests and local dev audits. */
const MOCK_VIOLATION_CATALOG: Record<string, A11yViolation[]> = {
  "/send": [
    {
      id: "label",
      impact: "serious",
      description: "Form elements must have labels",
      help: "Ensure every form element has a label",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.10/label",
      nodes: [{ html: "<input />", target: "#recipient" }],
    },
  ],
};

export class A11yService implements IA11yService {
  getPages(): A11yPageConfig[] {
    return [...A11Y_MAIN_PAGES];
  }

  getStandard(): typeof A11Y_WCAG_STANDARD {
    return A11Y_WCAG_STANDARD;
  }

  auditPage(request: A11yAuditRequest): A11yAuditResponse {
    const pathError = validateAuditPath(
      request.path,
      A11Y_MAIN_PAGES.map((page) => page.path),
    );
    if (pathError) {
      return {
        success: false,
        path: request.path,
        standard: A11Y_WCAG_STANDARD,
        summary: summarizeViolations([], request.path),
        violations: [],
        error: pathError,
      };
    }

    const minImpact: A11yImpactLevel = request.minImpact ?? "moderate";
    const rawViolations = MOCK_VIOLATION_CATALOG[request.path] ?? [];
    const violations = filterViolationsByImpact(rawViolations, minImpact);
    const summary = summarizeViolations(violations, request.path);

    return {
      success: true,
      path: request.path,
      standard: A11Y_WCAG_STANDARD,
      summary,
      violations,
    };
  }
}

export const a11yService = new A11yService();
