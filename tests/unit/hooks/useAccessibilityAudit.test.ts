/** @jest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAccessibilityAudit } from "@/hooks/useAccessibilityAudit";

describe("useAccessibilityAudit (Issue #24)", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("loads accessibility config from API", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        standard: "WCAG2AA",
        pages: [{ path: "/", label: "Dashboard", critical: true }],
      }),
    });

    const { result } = renderHook(() => useAccessibilityAudit());

    await act(async () => {
      await result.current.fetchConfig();
    });

    await waitFor(() => {
      expect(result.current.standard).toBe("WCAG2AA");
      expect(result.current.pages).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  it("audits a page and stores last result", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        path: "/",
        standard: "WCAG2AA",
        summary: { pagePath: "/", violationCount: 0, passed: true, byImpact: {}, scannedAt: "2026-01-01T00:00:00.000Z" },
        violations: [],
      }),
    });

    const { result } = renderHook(() => useAccessibilityAudit());

    await act(async () => {
      const audit = await result.current.auditPage("/");
      expect(audit.success).toBe(true);
    });

    expect(result.current.lastAudit?.path).toBe("/");
  });

  it("surfaces API errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ error: "Path not in scope" }),
    });

    const { result } = renderHook(() => useAccessibilityAudit());

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.auditPage("/admin");
      } catch (err) {
        caught = err;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe("Path not in scope");
    expect(result.current.error).toBe("Path not in scope");
  });

  it("resets audit state", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        path: "/",
        standard: "WCAG2AA",
        summary: { pagePath: "/", violationCount: 0, passed: true, byImpact: {}, scannedAt: "2026-01-01T00:00:00.000Z" },
        violations: [],
      }),
    });

    const { result } = renderHook(() => useAccessibilityAudit());

    await act(async () => {
      await result.current.auditPage("/");
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.lastAudit).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
