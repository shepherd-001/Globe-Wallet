'use client'

import { useState, useCallback } from 'react'
import type {
  ChartDailyDataPoint,
  ChartAnalyticsApiResponse,
  ChartSeriesConfig,
} from '@/lib/types'

export type ChartPeriod = 'week' | 'month' | 'year'

export interface ChartDataState {
  points: ChartDailyDataPoint[]
  average: number
  peak: number
  period: ChartPeriod
}

interface UseChartDataReturn {
  data: ChartDataState | null
  loading: boolean
  error: string | null
  seriesConfig: ChartSeriesConfig[]
  fetch: (period?: ChartPeriod) => Promise<void>
  formatValue: (value: number) => string
}

const DEFAULT_SERIES_CONFIG: ChartSeriesConfig[] = [
  {
    dataKey: 'value',
    label: 'Activity',
    color: '#10b981',
    gradientId: 'activityGradient',
  },
]

export function useChartData(): UseChartDataReturn {
  const [data, setData] = useState<ChartDataState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (period: ChartPeriod = 'week') => {
    setLoading(true)
    setError(null)

    try {
      const res = await globalThis.fetch(`/api/analytics?period=${period}`)
      const json: ChartAnalyticsApiResponse = await res.json()

      if (!json.success || !json.data) {
        throw new Error(json.error ?? 'Failed to load chart data')
      }

      setData({
        points: json.data.points,
        average: json.data.average,
        peak: json.data.peak,
        period: json.data.period,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const formatValue = useCallback((value: number): string => {
    return `${value}%`
  }, [])

  return {
    data,
    loading,
    error,
    seriesConfig: DEFAULT_SERIES_CONFIG,
    fetch,
    formatValue,
  }
}
