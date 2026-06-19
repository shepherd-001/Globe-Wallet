"use client";

import { useCallback, useState } from "react";
import type { A11yAuditResponse, A11yPageConfig } from "@/lib/types";

interface A11yConfigResponse {
  standard: string;
  pages: A11yPageConfig[];
}

interface UseAccessibilityAuditResult {
  pages: A11yPageConfig[];
  standard: string | null;
  lastAudit: A11yAuditResponse | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<A11yConfigResponse>;
  auditPage: (path: string) => Promise<A11yAuditResponse>;
  reset: () => void;
}

export function useAccessibilityAudit(): UseAccessibilityAuditResult {
  const [pages, setPages] = useState<A11yPageConfig[]>([]);
  const [standard, setStandard] = useState<string | null>(null);
  const [lastAudit, setLastAudit] = useState<A11yAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async (): Promise<A11yConfigResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/a11y");
      if (!response.ok) {
        throw new Error(`Failed to load accessibility config (${response.status})`);
      }

      const data = (await response.json()) as A11yConfigResponse;
      setPages(data.pages);
      setStandard(data.standard);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown accessibility error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const auditPage = useCallback(async (path: string): Promise<A11yAuditResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/a11y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      const data = (await response.json()) as A11yAuditResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `Audit failed (${response.status})`);
      }

      setLastAudit(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Audit request failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLastAudit(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    pages,
    standard,
    lastAudit,
    loading,
    error,
    fetchConfig,
    auditPage,
    reset,
  };
}
