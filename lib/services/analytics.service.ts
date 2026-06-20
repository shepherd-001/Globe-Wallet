import type {
  IAnalyticsService,
  AnalyticsDashboard,
  AnalyticsRequest,
  AnalyticsMetricId,
  AnalyticsStat,
  ChartDataPoint,
  ChartInterval,
  Transaction,
} from '../types'
import {
  buildVolumeHistory,
  buildCategoryBreakdown,
  buildTopAssets,
  computeStat,
} from '../analytics/chart-data'
import { BaseService } from './base.service'
import { MOCK_TRANSACTIONS } from '../fixtures/transactions'

const METRIC_IDS: AnalyticsMetricId[] = [
  'transaction_volume',
  'send_count',
  'receive_count',
  'active_wallets',
]

export class AnalyticsService extends BaseService implements IAnalyticsService {
  constructor() {
    super('AnalyticsService')
  }

  async getDashboard(request: AnalyticsRequest): Promise<AnalyticsDashboard> {
    return this.withPerformanceTracking('getDashboard', async () => {
      const transactions = this.loadTransactions()
      const stats: AnalyticsStat[] = METRIC_IDS.map((id) =>
        computeStat(id, transactions),
      )
      return {
        interval: request.interval,
        stats,
        volumeHistory: buildVolumeHistory(transactions, request.interval),
        categoryBreakdown: buildCategoryBreakdown(transactions),
        topAssets: buildTopAssets(transactions),
      }
    })
  }

  getVolumeHistory(interval: ChartInterval): ChartDataPoint[] {
    const transactions = this.loadTransactions()
    return buildVolumeHistory(transactions, interval)
  }

  getCategoryBreakdown(
    transactions: Transaction[],
  ): AnalyticsDashboard['categoryBreakdown'] {
    return buildCategoryBreakdown(transactions)
  }

  computeStat(id: AnalyticsMetricId, transactions: Transaction[]): AnalyticsStat {
    return computeStat(id, transactions)
  }

  private loadTransactions(): Transaction[] {
    return MOCK_TRANSACTIONS
  }
}
/**
 * lib/services/analytics.service.ts
 * Issue #19: Analytics service for posting merge events and tracking CI metrics.
 *
 * This service handles posting merge analytics payloads to a configurable URL,
 * with retry logic and error handling.
 * All configuration is via environment variables — no secrets in code.
 */

import type { MergeAnalyticsPayloadV2, CIWorkflowStep } from "../types"

const DEFAULT_TIMEOUT = 10_000

/**
 * Post a merge analytics payload to the configured URL.
 * Returns true if the POST succeeded, false otherwise.
 * No secrets or sensitive data are included in the payload.
 */
export async function postMergeAnalytics(
  payload: MergeAnalyticsPayloadV2,
  url?: string,
  timeout = DEFAULT_TIMEOUT,
): Promise<boolean> {
  const targetUrl = url ?? process.env.MERGE_ANALYTICS_URL ?? ""

  if (!targetUrl) {
    console.warn("[AnalyticsService] MERGE_ANALYTICS_URL not configured; skipping POST")
    return false
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      console.warn(`[AnalyticsService] POST returned ${response.status}`)
      return false
    }

    console.info("[AnalyticsService] Merge analytics posted successfully")
    return true
  } catch (error) {
    console.error("[AnalyticsService] Failed to post merge analytics:", error)
    return false
  }
}

/**
 * Build a MergeAnalyticsPayloadV2 from the given parameters.
 * Pure function, no side-effects.
 */
export function buildMergePayload(params: {
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
}): MergeAnalyticsPayloadV2 {
  return {
    event: "merge",
    repository: params.repository,
    branch: params.branch,
    commit: params.commit,
    timestamp: new Date().toISOString(),
    author: params.author,
    issue: params.issue,
    issues: params.issues ?? [params.issue],
    status: params.status ?? "success",
    coverage_verified: params.coverageVerified ?? false,
    fixture_coverage_verified: params.fixtureCoverageVerified ?? false,
    accessibility_verified: params.accessibilityVerified ?? false,
    test_count: params.testResults?.total ?? 0,
    pass_count: params.testResults?.passed ?? 0,
    fail_count: params.testResults?.failed ?? 0,
  }
}

/**
 * Format a CI workflow step summary for logging and analytics.
 */
export function formatWorkflowSummary(steps: CIWorkflowStep[]): string {
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
}
