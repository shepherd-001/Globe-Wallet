import { NextRequest, NextResponse } from 'next/server'
import type { ChartDailyDataPoint, ChartAnalyticsApiResponse } from '@/lib/types'

const WEEKLY_DATA: ChartDailyDataPoint[] = [
  { day: 'S', value: 45, label: 'Sunday' },
  { day: 'M', value: 75, label: 'Monday' },
  { day: 'T', value: 74, label: 'Tuesday' },
  { day: 'W', value: 92, label: 'Wednesday' },
  { day: 'T', value: 35, label: 'Thursday' },
  { day: 'F', value: 60, label: 'Friday' },
  { day: 'S', value: 50, label: 'Saturday' },
]

function computeStats(points: ChartDailyDataPoint[]) {
  const values = points.map((p) => p.value)
  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  const peak = Math.max(...values)
  return { average, peak }
}

export async function GET(request: NextRequest): Promise<NextResponse<ChartAnalyticsApiResponse>> {
  const { searchParams } = request.nextUrl
  const period = searchParams.get('period') ?? 'week'

  if (period !== 'week' && period !== 'month' && period !== 'year') {
    return NextResponse.json(
      { success: false, error: `Invalid period "${period}". Must be week | month | year.` },
      { status: 400 },
    )
  }

  const points = WEEKLY_DATA
  const { average, peak } = computeStats(points)

  return NextResponse.json({
    success: true,
    data: { period, points, average, peak },
  })
}
