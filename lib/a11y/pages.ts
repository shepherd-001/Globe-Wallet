import type { A11yPageConfig } from "@/lib/types";

/** Main wallet routes scanned by automated accessibility checks (Issue #24). */
export const A11Y_MAIN_PAGES: readonly A11yPageConfig[] = [
  { path: "/", label: "Dashboard", critical: true },
  { path: "/send", label: "Send Money", critical: true },
  { path: "/receive", label: "Receive", critical: true },
  { path: "/convert", label: "Convert", critical: true },
  { path: "/off-ramp", label: "Off-Ramp", critical: true },
  { path: "/savings", label: "Savings", critical: false },
  { path: "/cards", label: "Cards", critical: false },
  { path: "/profile", label: "Profile", critical: false },
] as const;

export const A11Y_WCAG_STANDARD = "WCAG2AA" as const;

export const A11Y_MAIN_CONTENT_ID = "main-content" as const;

export function getPageConfig(path: string): A11yPageConfig | undefined {
  return A11Y_MAIN_PAGES.find((page) => page.path === path);
}

export function getCriticalPagePaths(): string[] {
  return A11Y_MAIN_PAGES.filter((page) => page.critical).map((page) => page.path);
}
