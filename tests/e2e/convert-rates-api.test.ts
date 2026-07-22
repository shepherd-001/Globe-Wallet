/** @jest-environment node */
/**
 * Integration tests — Convert rates API + AssetService (Issue #20)
 *
 * Covers:
 *   1. GET /api/rates — returns MOCK_SIMPLE_RATES wrapped with updatedAt
 *   2. AssetService.convertAsset — end-to-end using the live fixture rates
 *   3. UI → API contract simulation: verify that the rate table used by the
 *      convert page is consistent with what the API returns
 *
 * No real network calls are made. The route uses FixtureFactory.getSimpleRates()
 * which reads MOCK_SIMPLE_RATES — tested here without mocking the fixture layer
 * so we catch regressions if the fixture is mutated.
 */

import { GET } from '../../app/api/rates/route'
import { AssetService } from '../../lib/services/asset.service'
import { MOCK_SIMPLE_RATES, MOCK_CONVERSION_RATES } from '../../lib/fixtures'
import type { AssetCode } from '../../lib/types'

// ── /api/rates route ──────────────────────────────────────────────────────────

describe('GET /api/rates', () => {
  it('returns HTTP 200', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('response body contains a rates object', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body).toHaveProperty('rates')
    expect(typeof body.rates).toBe('object')
  })

  it('response body contains an updatedAt ISO timestamp', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body).toHaveProperty('updatedAt')
    expect(new Date(body.updatedAt).toISOString()).toBe(body.updatedAt)
  })

  it('rates include XLM_USD entry', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.rates).toHaveProperty('XLM_USD')
    expect(typeof body.rates['XLM_USD']).toBe('number')
    expect(body.rates['XLM_USD']).toBeGreaterThan(0)
  })

  it('rates include USDC_USD at exactly 1.0', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.rates['USDC_USD']).toBe(1.0)
  })

  it('rates include USDT_USD at exactly 1.0', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.rates['USDT_USD']).toBe(1.0)
  })

  it('all rate values are positive numbers', async () => {
    const response = await GET()
    const body = await response.json()
    Object.entries(body.rates).forEach(([key, value]) => {
      expect(typeof value).toBe('number')
      expect(value as number).toBeGreaterThan(0)
    })
  })

  it('returns Content-Type application/json', async () => {
    const response = await GET()
    expect(response.headers.get('content-type')).toMatch(/application\/json/)
  })
})

// ── Fixture consistency ───────────────────────────────────────────────────────

describe('Fixture consistency — MOCK_SIMPLE_RATES ↔ MOCK_CONVERSION_RATES', () => {
  it('XLM_USD in MOCK_SIMPLE_RATES matches XLM→USD in conversion table', () => {
    expect(MOCK_SIMPLE_RATES['XLM_USD']).toBeCloseTo(
      MOCK_CONVERSION_RATES['XLM']['USD'],
      4,
    )
  })

  it('USDC_USD in MOCK_SIMPLE_RATES matches USDC→USD in conversion table', () => {
    expect(MOCK_SIMPLE_RATES['USDC_USD']).toBeCloseTo(
      MOCK_CONVERSION_RATES['USDC']['USD'],
      4,
    )
  })

  it('EUR_USD in MOCK_SIMPLE_RATES is consistent with EUR→USD conversion rate', () => {
    // Simple rate should be within 5% of the full conversion table value
    const simpleRate = MOCK_SIMPLE_RATES['EUR_USD']
    const convRate = MOCK_CONVERSION_RATES['EUR']['USD']
    expect(Math.abs(simpleRate - convRate) / convRate).toBeLessThan(0.05)
  })
})

// ── AssetService integration with fixture rates ───────────────────────────────

describe('AssetService — integration with fixture rates', () => {
  let service: AssetService

  beforeEach(() => {
    service = new AssetService()
  })

  const PAIRS: [AssetCode, AssetCode][] = [
    ['XLM', 'USDC'],
    ['XLM', 'USDT'],
    ['USDC', 'XLM'],
    ['USDT', 'XLM'],
    ['XLM', 'NGN'],
    ['USDC', 'NGN'],
    ['EUR', 'USD'],
    ['USD', 'EUR'],
  ]

  it.each(PAIRS)(
    'convertAsset(%s → %s) returns a positive finite number',
    async (from, to) => {
      const result = service.convertAsset(from, to, 100)
      expect(Number.isFinite(result)).toBe(true)
      expect(result).toBeGreaterThan(0)
    },
  )

  it('converts 0 to 0 for any pair', () => {
    PAIRS.forEach(([from, to]) => {
      expect(service.convertAsset(from, to, 0)).toBe(0)
    })
  })

  it('XLM→USDC conversion of 1000 XLM is in the expected range ($50–$200)', () => {
    const result = service.convertAsset('XLM', 'USDC', 1000)
    expect(result).toBeGreaterThan(50)
    expect(result).toBeLessThan(200)
  })

  it('getAssetPrice resolves and matches the priceUsd in fixtures', async () => {
    const price = await service.getAssetPrice('XLM')
    expect(price).toBe(MOCK_CONVERSION_RATES['XLM']['USD'])
  })

  it('API rate XLM_USD and getAssetPrice(XLM) are within 1% of each other', async () => {
    const apiResponse = await GET()
    const body = await apiResponse.json()
    const apiRate = body.rates['XLM_USD']
    const servicePrice = await service.getAssetPrice('XLM')

    const diff = Math.abs(apiRate - servicePrice) / servicePrice
    expect(diff).toBeLessThan(0.01)
  })
})
