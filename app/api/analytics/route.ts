/** @jest-environment node */
import { NextRequest, NextResponse } from 'next/server'
import type { AnalyticsRequest, AnalyticsResponse, ChartInterval } from '@/lib/types'
import { AnalyticsService } from '@/lib/services/analytics.service'

const analyticsService = new AnalyticsService()

const VALID_INTERVALS: ChartInterval[] = ['day', 'week', 'month', 'year']

export async function GET(request: NextRequest): Promise<NextResponse<AnalyticsResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const rawInterval = searchParams.get('interval') ?? 'week'
    const from = searchParams.get('from') ?? undefined
    const to = searchParams.get('to') ?? undefined

    if (!VALID_INTERVALS.includes(rawInterval as ChartInterval)) {
      return NextResponse.json(
        { success: false, error: `Invalid interval. Must be one of: ${VALID_INTERVALS.join(', ')}` },
        { status: 400 },
      )
    }

    const analyticsRequest: AnalyticsRequest = {
      interval: rawInterval as ChartInterval,
      from,
      to,
    }

    const data = await analyticsService.getDashboard(analyticsRequest)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
