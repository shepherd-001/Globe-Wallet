'use client'

import { useState, useCallback, useEffect } from 'react'
import type { AnalyticsDashboard, ChartInterval } from '@/lib/types'

interface UseAnalyticsState {
  dashboard: AnalyticsDashboard | null
  loading: boolean
  error: string | null
  interval: ChartInterval
}

interface UseAnalyticsResult extends UseAnalyticsState {
  setInterval: (interval: ChartInterval) => void
  refresh: () => Promise<void>
}

export function useAnalytics(initialInterval: ChartInterval = 'week'): UseAnalyticsResult {
  const [state, setState] = useState<UseAnalyticsState>({
    dashboard: null,
    loading: true,
    error: null,
    interval: initialInterval,
  })

  const fetchDashboard = useCallback(async (interval: ChartInterval) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch(`/api/analytics?interval=${interval}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `Request failed with status ${res.status}`)
      }
      const json = await res.json()
      if (!json.success || !json.data) {
        throw new Error(json.error ?? 'Unexpected response from analytics API')
      }
      setState((prev) => ({ ...prev, dashboard: json.data as AnalyticsDashboard, loading: false }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics'
      setState((prev) => ({ ...prev, error: message, loading: false }))
    }
  }, [])

  useEffect(() => {
    fetchDashboard(state.interval)
  }, [fetchDashboard, state.interval])

  const setInterval = useCallback(
    (interval: ChartInterval) => {
      setState((prev) => ({ ...prev, interval }))
    },
    [],
  )

  const refresh = useCallback(
    () => fetchDashboard(state.interval),
    [fetchDashboard, state.interval],
  )

  return { ...state, setInterval, refresh }
"use client"

import { useCallback, useState } from "react"
import { postMergeAnalytics, buildMergePayload } from "@/lib/services/analytics.service"
import type { MergeAnalyticsPayloadV2, CIWorkflowStep } from "@/lib/types"

interface UseAnalyticsReturn {
  posting: boolean
  lastResult: boolean | null
  postMerge: (params: {
    repository: string
    branch: string
    commit: string
    author: string
    issue: number
    issues?: number[]
    coverageVerified?: boolean
    fixtureCoverageVerified?: boolean
    accessibilityVerified?: boolean
    testResults?: { total: number; passed: number; failed: number }
    status?: "success" | "failure"
  }) => Promise<boolean>
  buildSummary: (steps: CIWorkflowStep[]) => string
}

/**
 * useAnalytics — hook for posting merge analytics and formatting workflow summaries.
 * Issue #19: Provides a client-side interface for CI/CD analytics tracking.
 *
 * Security: No secrets or private keys are handled. The URL is obtained from
 * environment variables or passed explicitly.
 */
export function useAnalytics(): UseAnalyticsReturn {
  const [posting, setPosting] = useState(false)
  const [lastResult, setLastResult] = useState<boolean | null>(null)

  const postMerge = useCallback(
    async (params: {
      repository: string
      branch: string
      commit: string
      author: string
      issue: number
      issues?: number[]
      coverageVerified?: boolean
      fixtureCoverageVerified?: boolean
      accessibilityVerified?: boolean
      testResults?: { total: number; passed: number; failed: number }
      status?: "success" | "failure"
    }): Promise<boolean> => {
      setPosting(true)
      try {
        const payload: MergeAnalyticsPayloadV2 = buildMergePayload(params)
        const result = await postMergeAnalytics(payload)
        setLastResult(result)
        return result
      } catch {
        setLastResult(false)
        return false
      } finally {
        setPosting(false)
      }
    },
    [],
  )

  const buildSummary = useCallback((steps: CIWorkflowStep[]): string => {
    const total = steps.length
    const passed = steps.filter((s) => s.status === "success").length
    const failed = steps.filter((s) => s.status === "failure").length
    const totalDuration = steps.reduce((sum, s) => sum + s.durationMs, 0)

    return [
      `Workflow completed: ${passed}/${total} steps passed, ${failed} failed`,
      `Total duration: ${(totalDuration / 1000).toFixed(2)}s`,
      ...steps.map(
        (s) => `  [${s.status.toUpperCase()}] ${s.name} (${s.durationMs}ms)`,
      ),
    ].join("\n")
  }, [])

  return {
    posting,
    lastResult,
    postMerge,
    buildSummary,
  }
}
