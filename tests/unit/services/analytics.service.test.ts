import { AnalyticsService } from '../../../lib/services/analytics.service'
import type { ChartInterval } from '../../../lib/types'

describe('AnalyticsService', () => {
  let service: AnalyticsService

  beforeEach(() => {
    service = new AnalyticsService()
  })

  describe('getDashboard', () => {
    const intervals: ChartInterval[] = ['day', 'week', 'month', 'year']

    it.each(intervals)('returns a valid dashboard for interval=%s', async (interval) => {
      const dashboard = await service.getDashboard({ interval })
      expect(dashboard.interval).toBe(interval)
      expect(Array.isArray(dashboard.stats)).toBe(true)
      expect(Array.isArray(dashboard.volumeHistory)).toBe(true)
      expect(Array.isArray(dashboard.categoryBreakdown)).toBe(true)
      expect(Array.isArray(dashboard.topAssets)).toBe(true)
    })

    it('dashboard stats include required metric ids', async () => {
      const dashboard = await service.getDashboard({ interval: 'week' })
      const ids = dashboard.stats.map((s) => s.id)
      expect(ids).toContain('transaction_volume')
      expect(ids).toContain('send_count')
      expect(ids).toContain('receive_count')
      expect(ids).toContain('active_wallets')
    })

    it('each stat has required fields', async () => {
      const { stats } = await service.getDashboard({ interval: 'week' })
      stats.forEach((stat) => {
        expect(stat).toHaveProperty('id')
        expect(stat).toHaveProperty('title')
        expect(stat).toHaveProperty('value')
        expect(stat).toHaveProperty('numericValue')
        expect(stat).toHaveProperty('change')
        expect(stat).toHaveProperty('changePct')
        expect(['up', 'down', 'flat']).toContain(stat.trend)
      })
    })

    it('volume history points have label and positive value', async () => {
      const { volumeHistory } = await service.getDashboard({ interval: 'week' })
      expect(volumeHistory.length).toBeGreaterThan(0)
      volumeHistory.forEach((p) => {
        expect(typeof p.label).toBe('string')
        expect(typeof p.value).toBe('number')
        expect(p.value).toBeGreaterThan(0)
      })
    })

    it('top assets have asset, volume, and pct fields', async () => {
      const { topAssets } = await service.getDashboard({ interval: 'week' })
      topAssets.forEach((a) => {
        expect(typeof a.asset).toBe('string')
        expect(typeof a.volume).toBe('number')
        expect(typeof a.pct).toBe('number')
      })
    })
  })

  describe('getVolumeHistory', () => {
    it('returns 7 points for day interval', () => {
      expect(service.getVolumeHistory('day')).toHaveLength(7)
    })

    it('returns 12 points for year interval', () => {
      expect(service.getVolumeHistory('year')).toHaveLength(12)
    })
  })

  describe('getCategoryBreakdown', () => {
    it('returns empty array for no transactions', () => {
      expect(service.getCategoryBreakdown([])).toEqual([])
    })

    it('handles categorised transactions', () => {
      const txs = [
        { id: 't1', type: 'send' as const, amount: 100, asset: 'XLM' as const,
          address: 'G...', date: 'Today', status: 'completed' as const, category: 'payment' as const },
      ]
      const result = service.getCategoryBreakdown(txs)
      expect(result).toHaveLength(1)
      expect(result[0].category).toBe('payment')
    })
  })

  describe('computeStat', () => {
    it('delegates to chart-data computeStat', () => {
      const stat = service.computeStat('send_count', [])
      expect(stat.id).toBe('send_count')
      expect(stat.numericValue).toBe(0)
    })
  })
})
