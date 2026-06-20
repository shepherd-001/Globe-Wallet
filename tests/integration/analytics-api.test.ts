/** @jest-environment node */
/**
 * Integration test: /api/analytics route (Issue #15)
 * Verifies end-to-end API shape, parameter validation, and service integration.
 */
import { NextRequest } from 'next/server'
import { GET } from '../../app/api/analytics/route'

const makeRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/analytics')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url)
}

describe('GET /api/analytics', () => {
  it('returns success:true with data for default interval', async () => {
    const res = await GET(makeRequest())
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it('returns correct interval in response data', async () => {
    const res = await GET(makeRequest({ interval: 'month' }))
    const body = await res.json()
    expect(body.data.interval).toBe('month')
  })

  it('returns 400 for invalid interval', async () => {
    const res = await GET(makeRequest({ interval: 'hour' }))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/interval/i)
  })

  it.each(['day', 'week', 'month', 'year'] as const)(
    'returns valid dashboard for interval=%s',
    async (interval) => {
      const res = await GET(makeRequest({ interval }))
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      const { data } = body
      expect(data.interval).toBe(interval)
      expect(Array.isArray(data.stats)).toBe(true)
      expect(Array.isArray(data.volumeHistory)).toBe(true)
      expect(Array.isArray(data.categoryBreakdown)).toBe(true)
      expect(Array.isArray(data.topAssets)).toBe(true)
    },
  )

  it('dashboard stats each have required fields', async () => {
    const res = await GET(makeRequest({ interval: 'week' }))
    const { data } = await res.json()
    data.stats.forEach((stat: Record<string, unknown>) => {
      expect(typeof stat.id).toBe('string')
      expect(typeof stat.title).toBe('string')
      expect(typeof stat.value).toBe('string')
      expect(typeof stat.numericValue).toBe('number')
      expect(typeof stat.changePct).toBe('number')
      expect(['up', 'down', 'flat']).toContain(stat.trend)
    })
  })

  it('volumeHistory points have positive numeric values', async () => {
    const res = await GET(makeRequest({ interval: 'day' }))
    const { data } = await res.json()
    data.volumeHistory.forEach((p: Record<string, unknown>) => {
      expect(typeof p.label).toBe('string')
      expect(typeof p.value).toBe('number')
      expect(p.value as number).toBeGreaterThan(0)
    })
  })

  it('API success path returns topAssets with pct field', async () => {
    const res = await GET(makeRequest({ interval: 'week' }))
    const { data } = await res.json()
    if (data.topAssets.length > 0) {
      data.topAssets.forEach((a: Record<string, unknown>) => {
        expect(typeof a.asset).toBe('string')
        expect(typeof a.pct).toBe('number')
      })
    }
  })

  it('accepts optional from/to query params without error', async () => {
    const res = await GET(makeRequest({
      interval: 'month',
      from: '2026-01-01',
      to:   '2026-06-01',
    }))
    expect(res.status).toBe(200)
  })
})
