/**
 * Unit tests for chart type helpers and analytics data utilities (Issue #17).
 * Covers: ChartDailyDataPoint shape, ActivityTooltipProps narrowing,
 * ChartAnalyticsApiResponse schema, and computeStats logic.
 */

import type {
  ChartDailyDataPoint,
  ActivityTooltipProps,
  ChartTooltipEntry,
  ChartAnalyticsApiResponse,
  ChartSeriesConfig,
} from '../../lib/types'

// ── helpers mirroring production code ────────────────────────────────────────

function computeAverage(points: ChartDailyDataPoint[]): number {
  if (points.length === 0) return 0
  return Math.round(points.reduce((acc, p) => acc + p.value, 0) / points.length)
}

function computePeak(points: ChartDailyDataPoint[]): number {
  if (points.length === 0) return 0
  return Math.max(...points.map((p) => p.value))
}

function buildTooltipEntry(
  point: ChartDailyDataPoint,
  overrides: Partial<ChartTooltipEntry> = {},
): ChartTooltipEntry {
  return {
    value: point.value,
    dataKey: 'value',
    name: 'Activity',
    payload: point,
    fill: '#10b981',
    ...overrides,
  }
}

function formatValue(value: number): string {
  return `${value}%`
}

// ── fixtures ─────────────────────────────────────────────────────────────────

const WEEKLY_POINTS: ChartDailyDataPoint[] = [
  { day: 'S', value: 45, label: 'Sunday' },
  { day: 'M', value: 75, label: 'Monday' },
  { day: 'T', value: 74, label: 'Tuesday' },
  { day: 'W', value: 92, label: 'Wednesday' },
  { day: 'T', value: 35, label: 'Thursday' },
  { day: 'F', value: 60, label: 'Friday' },
  { day: 'S', value: 50, label: 'Saturday' },
]

// ── ChartDailyDataPoint ───────────────────────────────────────────────────────

describe('ChartDailyDataPoint', () => {
  it('has required string day and label and numeric value', () => {
    const point: ChartDailyDataPoint = { day: 'M', value: 75, label: 'Monday' }
    expect(typeof point.day).toBe('string')
    expect(typeof point.value).toBe('number')
    expect(typeof point.label).toBe('string')
  })

  it('value is within expected 0–100 range for each fixture', () => {
    WEEKLY_POINTS.forEach((p) => {
      expect(p.value).toBeGreaterThanOrEqual(0)
      expect(p.value).toBeLessThanOrEqual(100)
    })
  })

  it('day labels are single characters', () => {
    WEEKLY_POINTS.forEach((p) => {
      expect(p.day).toHaveLength(1)
    })
  })

  it('label contains the full day name', () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const labels = WEEKLY_POINTS.map((p) => p.label)
    days.forEach((d) => expect(labels).toContain(d))
  })
})

// ── computeAverage ────────────────────────────────────────────────────────────

describe('computeAverage', () => {
  it('calculates the rounded mean of all data point values', () => {
    expect(computeAverage(WEEKLY_POINTS)).toBe(62)
  })

  it('returns 0 for an empty array', () => {
    expect(computeAverage([])).toBe(0)
  })

  it('returns the value itself for a single point', () => {
    expect(computeAverage([{ day: 'M', value: 80, label: 'Monday' }])).toBe(80)
  })

  it('rounds fractional averages', () => {
    const pts: ChartDailyDataPoint[] = [
      { day: 'A', value: 1, label: 'A' },
      { day: 'B', value: 2, label: 'B' },
    ]
    expect(computeAverage(pts)).toBe(2)
  })
})

// ── computePeak ───────────────────────────────────────────────────────────────

describe('computePeak', () => {
  it('identifies the maximum value across all data points', () => {
    expect(computePeak(WEEKLY_POINTS)).toBe(92)
  })

  it('returns 0 for an empty array', () => {
    expect(computePeak([])).toBe(0)
  })

  it('returns the single value when there is one point', () => {
    expect(computePeak([{ day: 'M', value: 55, label: 'Monday' }])).toBe(55)
  })

  it('handles all equal values', () => {
    const pts: ChartDailyDataPoint[] = Array.from({ length: 4 }, (_, i) => ({
      day: String(i),
      value: 50,
      label: `Day ${i}`,
    }))
    expect(computePeak(pts)).toBe(50)
  })
})

// ── ActivityTooltipProps narrowing ────────────────────────────────────────────

describe('ActivityTooltipProps', () => {
  it('accepts undefined active and payload (inactive tooltip)', () => {
    const props: ActivityTooltipProps = {}
    expect(props.active).toBeUndefined()
    expect(props.payload).toBeUndefined()
  })

  it('accepts active=false with no payload', () => {
    const props: ActivityTooltipProps = { active: false }
    expect(props.active).toBe(false)
  })

  it('accepts active=true with a typed payload array', () => {
    const entry = buildTooltipEntry(WEEKLY_POINTS[1])
    const props: ActivityTooltipProps = { active: true, payload: [entry], label: 'M' }
    expect(props.payload![0].value).toBe(75)
    expect(props.payload![0].payload.label).toBe('Monday')
  })

  it('payload[0].fill is accessible as string | undefined', () => {
    const entry = buildTooltipEntry(WEEKLY_POINTS[0], { fill: '#059669' })
    const props: ActivityTooltipProps = { active: true, payload: [entry] }
    expect(props.payload![0].fill).toBe('#059669')
  })
})

// ── buildTooltipEntry ─────────────────────────────────────────────────────────

describe('buildTooltipEntry', () => {
  it('sets value from the data point', () => {
    const entry = buildTooltipEntry({ day: 'W', value: 92, label: 'Wednesday' })
    expect(entry.value).toBe(92)
  })

  it('nests the full data point under payload', () => {
    const point: ChartDailyDataPoint = { day: 'F', value: 60, label: 'Friday' }
    const entry = buildTooltipEntry(point)
    expect(entry.payload).toEqual(point)
  })

  it('allows overriding fill color', () => {
    const entry = buildTooltipEntry(WEEKLY_POINTS[0], { fill: '#ff0000' })
    expect(entry.fill).toBe('#ff0000')
  })

  it('defaults dataKey to "value"', () => {
    const entry = buildTooltipEntry(WEEKLY_POINTS[0])
    expect(entry.dataKey).toBe('value')
  })
})

// ── formatValue ───────────────────────────────────────────────────────────────

describe('formatValue', () => {
  it('appends a percent sign to the numeric value', () => {
    expect(formatValue(75)).toBe('75%')
  })

  it('handles zero', () => {
    expect(formatValue(0)).toBe('0%')
  })

  it('handles 100', () => {
    expect(formatValue(100)).toBe('100%')
  })
})

// ── ChartAnalyticsApiResponse schema ─────────────────────────────────────────

describe('ChartAnalyticsApiResponse schema', () => {
  it('accepts a successful response with week data', () => {
    const response: ChartAnalyticsApiResponse = {
      success: true,
      data: {
        period: 'week',
        points: WEEKLY_POINTS,
        average: computeAverage(WEEKLY_POINTS),
        peak: computePeak(WEEKLY_POINTS),
      },
    }
    expect(response.success).toBe(true)
    expect(response.data?.period).toBe('week')
    expect(response.data?.points).toHaveLength(7)
  })

  it('accepts a failure response with an error message', () => {
    const response: ChartAnalyticsApiResponse = {
      success: false,
      error: 'Failed to load analytics data',
    }
    expect(response.success).toBe(false)
    expect(response.error).toBeDefined()
    expect(response.data).toBeUndefined()
  })

  it('period is constrained to week | month | year', () => {
    const periods: Array<'week' | 'month' | 'year'> = ['week', 'month', 'year']
    periods.forEach((period) => {
      const r: ChartAnalyticsApiResponse = {
        success: true,
        data: { period, points: [], average: 0, peak: 0 },
      }
      expect(r.data?.period).toBe(period)
    })
  })
})

// ── ChartSeriesConfig ─────────────────────────────────────────────────────────

describe('ChartSeriesConfig', () => {
  it('validates required fields', () => {
    const config: ChartSeriesConfig = {
      dataKey: 'value',
      label: 'Activity',
      color: '#10b981',
    }
    expect(config.dataKey).toBe('value')
    expect(config.color).toMatch(/^#/)
  })

  it('accepts optional gradientId', () => {
    const config: ChartSeriesConfig = {
      dataKey: 'value',
      label: 'Activity',
      color: '#10b981',
      gradientId: 'activityGradient',
    }
    expect(config.gradientId).toBe('activityGradient')
  })
})
