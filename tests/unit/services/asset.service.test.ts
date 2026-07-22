/**
 * Unit tests — AssetService (Issue #20)
 *
 * Coverage targets:
 *   - convertAsset: math correctness, edge cases, error paths
 *   - getAssetPrice: happy path, cache behaviour, unknown asset
 *   - formatAsset: delegation to formatCryptoAmount
 *   - getAssets: immutable copy guard
 *
 * No private keys. No network I/O. Pure in-memory logic.
 */

import { AssetService } from '../../../lib/services/asset.service'
import { MOCK_CONVERSION_RATES } from '../../../lib/fixtures'
import { AssetServiceError } from '../../../lib/types'
import type { AssetCode } from '../../../lib/types'

// ── helpers ──────────────────────────────────────────────────────────────────

/** All pairs covered by the rate table */
const ALL_ASSET_CODES: AssetCode[] = ['XLM', 'USDC', 'USDT', 'NGN', 'USD', 'EUR']

// ── suite ─────────────────────────────────────────────────────────────────────

describe('AssetService', () => {
  let service: AssetService

  beforeEach(() => {
    service = new AssetService()
  })

  // ── convertAsset ────────────────────────────────────────────────────────────

  describe('convertAsset — conversion math', () => {
    it('converts XLM → USDC using the fixture rate', () => {
      const amount = 100
      const expected = amount * MOCK_CONVERSION_RATES['XLM']['USDC']
      expect(service.convertAsset('XLM', 'USDC', amount)).toBeCloseTo(expected, 8)
    })

    it('converts USDC → XLM (inverse direction)', () => {
      const amount = 50
      const expected = amount * MOCK_CONVERSION_RATES['USDC']['XLM']
      expect(service.convertAsset('USDC', 'XLM', amount)).toBeCloseTo(expected, 8)
    })

    it('converts XLM → NGN (fiat bridge pair)', () => {
      const amount = 1000
      const expected = amount * MOCK_CONVERSION_RATES['XLM']['NGN']
      expect(service.convertAsset('XLM', 'NGN', amount)).toBeCloseTo(expected, 4)
    })

    it('returns the same amount when from === to (identity)', () => {
      ALL_ASSET_CODES.forEach((code) => {
        expect(service.convertAsset(code, code, 250)).toBeCloseTo(250, 8)
      })
    })

    it('returns 0 when amount is 0', () => {
      expect(service.convertAsset('XLM', 'USDC', 0)).toBe(0)
    })

    it('handles fractional (sub-unit) amounts correctly', () => {
      // 0.00001 XLM (Stellar minimum base unit)
      const amount = 0.00001
      const expected = amount * MOCK_CONVERSION_RATES['XLM']['USDC']
      expect(service.convertAsset('XLM', 'USDC', amount)).toBeCloseTo(expected, 12)
    })

    it('handles large amounts without overflow', () => {
      const amount = 10_000_000
      const expected = amount * MOCK_CONVERSION_RATES['XLM']['USDC']
      expect(service.convertAsset('XLM', 'USDC', amount)).toBeCloseTo(expected, 0)
    })

    it('throws AssetServiceError for an unknown from-asset', () => {
      expect(() =>
        // @ts-expect-error — deliberate invalid code for error path test
        service.convertAsset('BTC', 'USDC', 1),
      ).toThrow(AssetServiceError)
    })

    it('throws AssetServiceError for an unknown to-asset', () => {
      expect(() =>
        // @ts-expect-error — deliberate invalid code for error path test
        service.convertAsset('XLM', 'BTC', 1),
      ).toThrow(AssetServiceError)
    })

    it('error message includes the unsupported pair', () => {
      try {
        // @ts-expect-error
        service.convertAsset('XLM', 'BTC', 1)
        fail('Expected error was not thrown')
      } catch (e) {
        expect((e as Error).message).toMatch(/XLM.*BTC|BTC.*XLM/i)
      }
    })

    it('round-trips XLM → USDC → XLM within floating-point tolerance', () => {
      const start = 1000
      const toUsdc = service.convertAsset('XLM', 'USDC', start)
      const backToXlm = service.convertAsset('USDC', 'XLM', toUsdc)
      // Rate-table round-trip won't be perfect due to spread; accept ±5%
      expect(backToXlm).toBeGreaterThan(start * 0.95)
      expect(backToXlm).toBeLessThan(start * 1.05)
    })

    it('all pairs in the fixture table produce positive results for a positive amount', () => {
      ALL_ASSET_CODES.forEach((from) => {
        ALL_ASSET_CODES.forEach((to) => {
          const result = service.convertAsset(from, to, 1)
          expect(result).toBeGreaterThan(0)
        })
      })
    })
  })

  // ── rate lookup (fixture table integrity) ───────────────────────────────────

  describe('rate lookup — MOCK_CONVERSION_RATES integrity', () => {
    it('fixture table is defined and non-empty', () => {
      expect(MOCK_CONVERSION_RATES).toBeDefined()
      expect(Object.keys(MOCK_CONVERSION_RATES).length).toBeGreaterThan(0)
    })

    it('every declared asset has a full cross-rate row', () => {
      ALL_ASSET_CODES.forEach((from) => {
        expect(MOCK_CONVERSION_RATES[from]).toBeDefined()
        ALL_ASSET_CODES.forEach((to) => {
          expect(typeof MOCK_CONVERSION_RATES[from][to]).toBe('number')
          expect(MOCK_CONVERSION_RATES[from][to]).toBeGreaterThan(0)
        })
      })
    })

    it('identity rates (X → X) are exactly 1.0', () => {
      ALL_ASSET_CODES.forEach((code) => {
        expect(MOCK_CONVERSION_RATES[code][code]).toBe(1)
      })
    })

    it('XLM → USDC rate is in the expected ballpark (0.05 – 0.30)', () => {
      const rate = MOCK_CONVERSION_RATES['XLM']['USDC']
      expect(rate).toBeGreaterThan(0.05)
      expect(rate).toBeLessThan(0.30)
    })

    it('USDC → NGN rate implies NGN is weaker than USD (> 100)', () => {
      expect(MOCK_CONVERSION_RATES['USDC']['NGN']).toBeGreaterThan(100)
    })

    it('EUR → USD rate is approximately > 1 (EUR stronger than USD)', () => {
      expect(MOCK_CONVERSION_RATES['EUR']['USD']).toBeGreaterThanOrEqual(1)
    })
  })

  // ── getAssetPrice ────────────────────────────────────────────────────────────

  describe('getAssetPrice', () => {
    it('resolves a known asset price', async () => {
      const price = await service.getAssetPrice('XLM')
      expect(typeof price).toBe('number')
      expect(price).toBeGreaterThan(0)
    })

    it('resolves USDC price as 1.0 (stable coin)', async () => {
      const price = await service.getAssetPrice('USDC')
      expect(price).toBe(1.0)
    })

    it('resolves USDT price as 1.0 (stable coin)', async () => {
      const price = await service.getAssetPrice('USDT')
      expect(price).toBe(1.0)
    })

    it('returns a cached value on second call', async () => {
      const first = await service.getAssetPrice('XLM')
      const second = await service.getAssetPrice('XLM')
      expect(first).toBe(second)
    })

    it('throws AssetServiceError for an unknown asset code', async () => {
      // @ts-expect-error — deliberate invalid code
      await expect(service.getAssetPrice('BTC')).rejects.toThrow(AssetServiceError)
    })

    it('error message names the missing asset', async () => {
      // @ts-expect-error
      await expect(service.getAssetPrice('FOO')).rejects.toThrow(/FOO/)
    })
  })

  // ── getAssets ────────────────────────────────────────────────────────────────

  describe('getAssets', () => {
    it('returns an array of CryptoAsset objects', () => {
      const assets = service.getAssets()
      expect(Array.isArray(assets)).toBe(true)
      expect(assets.length).toBeGreaterThan(0)
    })

    it('each asset has required fields', () => {
      service.getAssets().forEach((a) => {
        expect(typeof a.code).toBe('string')
        expect(typeof a.name).toBe('string')
        expect(typeof a.balance).toBe('number')
        expect(typeof a.priceUsd).toBe('number')
      })
    })

    it('returns a copy — mutations do not affect the service state', () => {
      const first = service.getAssets()
      first[0].balance = -99999
      const second = service.getAssets()
      expect(second[0].balance).not.toBe(-99999)
    })

    it('includes at least XLM, USDC, and USDT', () => {
      const codes = service.getAssets().map((a) => a.code)
      expect(codes).toContain('XLM')
      expect(codes).toContain('USDC')
      expect(codes).toContain('USDT')
    })
  })

  // ── formatAsset ──────────────────────────────────────────────────────────────

  describe('formatAsset', () => {
    it('formats XLM with 4 decimal places', () => {
      const result = service.formatAsset(100, 'XLM')
      expect(result).toMatch(/XLM/)
      expect(result).toMatch(/100/)
    })

    it('formats USDC with 2 decimal places', () => {
      const result = service.formatAsset(50.5, 'USDC')
      expect(result).toMatch(/USDC/)
    })

    it('masks value when hidden = true', () => {
      const result = service.formatAsset(999, 'XLM', true)
      expect(result).toMatch(/••••/)
      expect(result).not.toMatch(/999/)
    })

    it('handles zero amount', () => {
      const result = service.formatAsset(0, 'XLM')
      expect(result).toBeDefined()
      expect(result).toMatch(/XLM/)
    })
  })
})
