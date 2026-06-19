import type {
  A11yAuditSummary,
  A11yImpactLevel,
  A11yViolation,
  A11yViolationNode,
} from "@/lib/types";

const IMPACT_ORDER: Record<A11yImpactLevel, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
  unknown: 4,
};

export function normalizeImpact(impact?: string | null): A11yImpactLevel {
  if (impact === "critical" || impact === "serious" || impact === "moderate" || impact === "minor") {
    return impact;
  }
  return "unknown";
}

export function sortViolationsByImpact(violations: A11yViolation[]): A11yViolation[] {
  return [...violations].sort(
    (a, b) => IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact],
  );
}

export function filterViolationsByImpact(
  violations: A11yViolation[],
  minImpact: A11yImpactLevel,
): A11yViolation[] {
  const threshold = IMPACT_ORDER[minImpact];
  return violations.filter((violation) => IMPACT_ORDER[violation.impact] <= threshold);
}

export function summarizeViolations(
  violations: A11yViolation[],
  pagePath: string,
): A11yAuditSummary {
  const byImpact: Record<A11yImpactLevel, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    unknown: 0,
  };

  for (const violation of violations) {
    byImpact[violation.impact] += 1;
  }

  return {
    pagePath,
    violationCount: violations.length,
    byImpact,
    passed: violations.length === 0,
    scannedAt: new Date().toISOString(),
  };
}

export function mapAxeNodes(nodes: Array<{ html?: string; target?: string | string[] }>): A11yViolationNode[] {
  return nodes.map((node) => ({
    html: node.html ?? "",
    target: Array.isArray(node.target) ? node.target.join(", ") : (node.target ?? ""),
  }));
}

export function formatViolationReport(violations: A11yViolation[]): string {
  if (violations.length === 0) {
    return "No accessibility violations detected.";
  }

  return sortViolationsByImpact(violations)
    .map((violation, index) => {
      const targets = violation.nodes.map((node) => node.target).filter(Boolean).join("; ");
      return `${index + 1}. [${violation.impact}] ${violation.id}: ${violation.description}${targets ? ` (${targets})` : ""}`;
    })
    .join("\n");
}

export function validateAuditPath(path: string, allowedPaths: readonly string[]): string | null {
  if (!path || typeof path !== "string") {
    return "Path is required";
  }
  if (!path.startsWith("/")) {
    return "Path must start with /";
  }
  if (!allowedPaths.includes(path)) {
    return `Path "${path}" is not in the accessibility audit scope`;
  }
  return null;
}
