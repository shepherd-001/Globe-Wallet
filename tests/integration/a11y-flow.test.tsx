/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { useAccessibilityAudit } from "@/hooks/useAccessibilityAudit";

describe("Accessibility audit flow (Issue #24)", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("loads config then audits a page via mocked API", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          standard: "WCAG2AA",
          pages: [
            { path: "/", label: "Dashboard", critical: true },
            { path: "/send", label: "Send Money", critical: true },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          path: "/send",
          standard: "WCAG2AA",
          summary: {
            pagePath: "/send",
            violationCount: 1,
            passed: false,
            byImpact: { critical: 0, serious: 1, moderate: 0, minor: 0, unknown: 0 },
            scannedAt: "2026-06-19T00:00:00.000Z",
          },
          violations: [
            {
              id: "label",
              impact: "serious",
              description: "Form elements must have labels",
              help: "Ensure every form element has a label",
              helpUrl: "https://example.com/label",
              nodes: [{ html: "<input />", target: "#recipient" }],
            },
          ],
        }),
      });

    const { result } = renderHook(() => useAccessibilityAudit());

    await act(async () => {
      const config = await result.current.fetchConfig();
      expect(config.pages).toHaveLength(2);
    });

    await act(async () => {
      const audit = await result.current.auditPage("/send");
      expect(audit.summary.passed).toBe(false);
      expect(audit.violations[0].id).toBe("label");
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/a11y");
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/a11y", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "/send" }),
    });
  });

  it("handles audit failure without optimistic pass", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        success: false,
        error: 'Path "/admin" is not in the accessibility audit scope',
      }),
    });

    const { result } = renderHook(() => useAccessibilityAudit());

    await expect(
      act(async () => {
        await result.current.auditPage("/admin");
      }),
    ).rejects.toThrow("not in the accessibility audit scope");

    expect(result.current.lastAudit).toBeNull();
  });
});
