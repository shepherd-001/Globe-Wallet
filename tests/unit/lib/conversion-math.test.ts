/**
 * Unit tests — Conversion Math Utilities (Issue #20)
 *
 * Covers the pure math helpers used by the convert page and services:
 *   - applyConversionRate      (rate × amount)
 *   - applyReverseRate         (amount / rate)
 *   - applyProcessingFee       (deduct 0.1%)
 *   - deriveToAmount / deriveFromAmount
 *   - lookupRate from an ExchangeRate[]
 *   - edge cases: zero, negative, NaN, Infinity, same-currency
 *
 * All functions are tested in isolation — no service or React imports.
 */

import fc from 'fast-check'
import Decimal from 'decimal.js'
import {
  applyConversionRate,
  applyReverseRate,
  applyProcessingFee,
  deriveToAmount,
  deriveFromAmount,
  lookupRate,
  calculateNetReceived,
  formatConversionRate,
} from '../../../lib/helpers/conversion-math'

// ─── applyConversionRate ──────────────────────────────────────────────────────

describe('applyConversionRate', () => {
  it('multiplies amount by rate', () => {
    expect(applyConversionRate(100, 0.095)).toBeCloseTo(9.5, 8)
  })

  it('handles rate of 1 (identity)', () => {
    expect(applyConversionRate(250, 1)).toBe(250)
  })

  it('handles rate > 1 (inverse pair)', () => {
    expect(applyConversionRate(10, 10.53)).toBeCloseTo(105.3, 4)
  })

  it('returns 0 for amount = 0', () => {
    expect(applyConversionRate(0, 0.095)).toBe(0)
  })

  it('returns 0 for rate = 0', () => {
    expect(applyConversionRate(100, 0)).toBe(0)
  })

  it('returns NaN for NaN amount', () => {
    expect(applyConversionRate(NaN, 0.1)).toBeNaN()
  })

  it('returns NaN for NaN rate', () => {
    expect(applyConversionRate(100, NaN)).toBeNaN()
  })

  it('returns Infinity for Infinite amount', () => {
    expect(applyConversionRate(Infinity, 0.1)).toBe(Infinity)
  })

  it('handles very small amounts (Stellar minimum 0.00001)', () => {
    const result = applyConversionRate(0.00001, 0.095)
    expect(result).toBeCloseTo(0.00000095, 12)
  })

  it('handles large amounts without precision loss', () => {
    const result = applyConversionRate(10_000_000, 0.095)
    expect(result).toBeCloseTo(950_000, 0)
  })
})

// ─── applyReverseRate ─────────────────────────────────────────────────────────

describe('applyReverseRate', () => {
  it('divides amount by rate', () => {
    expect(applyReverseRate(9.5, 0.095)).toBeCloseTo(100, 6)
  })

  it('round-trips with applyConversionRate', () => {
    const rate = 0.095
    const original = 200
    const converted = applyConversionRate(original, rate)
    const roundTripped = applyReverseRate(converted, rate)
    expect(roundTripped).toBeCloseTo(original, 6)
  })

  it('returns NaN for rate = 0 (division by zero)', () => {
    // Mathematically undefined — implementation should return NaN or Infinity
    const result = applyReverseRate(100, 0)
    expect(!isFinite(result) || isNaN(result)).toBe(true)
  })

  it('handles fractional amounts correctly', () => {
    expect(applyReverseRate(1.053, 10.53)).toBeCloseTo(0.1, 6)
  })
})

// ─── applyProcessingFee ───────────────────────────────────────────────────────

describe('applyProcessingFee', () => {
  it('deducts 0.1% by default', () => {
    expect(applyProcessingFee(1000)).toBeCloseTo(999, 4)
  })

  it('deducts a custom fee rate', () => {
    expect(applyProcessingFee(1000, 0.02)).toBeCloseTo(980, 4)
  })

  it('fee rate of 0 returns full amount', () => {
    expect(applyProcessingFee(500, 0)).toBe(500)
  })

  it('fee rate of 1 returns 0', () => {
    expect(applyProcessingFee(500, 1)).toBe(0)
  })

  it('does not go negative for oversized fee', () => {
    const result = applyProcessingFee(100, 2) // 200% fee → clamp to 0
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('returns 0 for zero amount', () => {
    expect(applyProcessingFee(0)).toBe(0)
  })

  it('returns NaN for NaN amount', () => {
    expect(applyProcessingFee(NaN)).toBeNaN()
  })
})

// ─── deriveToAmount / deriveFromAmount ────────────────────────────────────────

describe('deriveToAmount', () => {
  it('returns empty string when amount is empty', () => {
    expect(deriveToAmount('', 0.095)).toBe('')
  })

  it('returns empty string when rate is falsy', () => {
    expect(deriveToAmount('100', 0)).toBe('')
  })

  it('returns empty string for non-numeric input', () => {
    expect(deriveToAmount('abc', 0.095)).toBe('')
  })

  it('returns formatted number string for valid inputs', () => {
    const result = deriveToAmount('100', 0.095)
    expect(result).toBe((100 * 0.095).toFixed(6))
  })

  it('handles decimal amounts', () => {
    const result = deriveToAmount('10.5', 0.095)
    expect(result).toBe((10.5 * 0.095).toFixed(6))
  })
})

describe('deriveFromAmount', () => {
  it('returns empty string when amount is empty', () => {
    expect(deriveFromAmount('', 0.095)).toBe('')
  })

  it('returns empty string when rate is falsy', () => {
    expect(deriveFromAmount('100', 0)).toBe('')
  })

  it('returns empty string for non-numeric input', () => {
    expect(deriveFromAmount('abc', 0.095)).toBe('')
  })

  it('returns formatted number string (inverse calculation)', () => {
    const result = deriveFromAmount('9.5', 0.095)
    expect(result).toBe((9.5 / 0.095).toFixed(6))
  })
})

// ─── lookupRate ───────────────────────────────────────────────────────────────

describe('lookupRate', () => {
  const mockRates = [
    { from: 'XLM', to: 'USDC', rate: 0.095, change24h: 2.4 },
    { from: 'XLM', to: 'USDT', rate: 0.094, change24h: 1.8 },
    { from: 'USDC', to: 'XLM', rate: 10.53, change24h: -2.3 },
    { from: 'USDT', to: 'XLM', rate: 10.64, change24h: -1.7 },
  ]

  it('finds the correct rate for a valid pair', () => {
    const result = lookupRate(mockRates, 'XLM', 'USDC')
    expect(result).not.toBeNull()
    expect(result?.rate).toBe(0.095)
  })

  it('returns null for an unsupported pair', () => {
    const result = lookupRate(mockRates, 'XLM', 'EUR')
    expect(result).toBeNull()
  })

  it('is order-sensitive (XLM→USDC ≠ USDC→XLM)', () => {
    const xlmToUsdc = lookupRate(mockRates, 'XLM', 'USDC')
    const usdcToXlm = lookupRate(mockRates, 'USDC', 'XLM')
    expect(xlmToUsdc?.rate).not.toBe(usdcToXlm?.rate)
  })

  it('returns null for an empty rates array', () => {
    expect(lookupRate([], 'XLM', 'USDC')).toBeNull()
  })

  it('returns null when from equals to and pair not in table', () => {
    const result = lookupRate(mockRates, 'EUR', 'EUR')
    expect(result).toBeNull()
  })
})

// ─── calculateNetReceived ─────────────────────────────────────────────────────

describe('calculateNetReceived', () => {
  it('calculates received amount after default 0.1% processing fee', () => {
    const toAmount = '100.000000'
    const result = calculateNetReceived(toAmount)
    expect(result).toBeCloseTo(99.9, 4)
  })

  it('returns 0 for empty toAmount', () => {
    expect(calculateNetReceived('')).toBe(0)
  })

  it('returns 0 for non-numeric toAmount', () => {
    expect(calculateNetReceived('abc')).toBe(0)
  })

  it('applies a custom fee rate', () => {
    const result = calculateNetReceived('1000.000000', 0.02)
    expect(result).toBeCloseTo(980, 4)
  })
})

// ─── formatConversionRate ─────────────────────────────────────────────────────

describe('formatConversionRate', () => {
  it('formats rate to 6 decimal places', () => {
    const result = formatConversionRate('XLM', 'USDC', 0.095)
    expect(result).toBe('1 XLM = 0.095000 USDC')
  })

  it('handles rate of 1', () => {
    const result = formatConversionRate('USDC', 'USDT', 1)
    expect(result).toBe('1 USDC = 1.000000 USDT')
  })

  it('formats large rates correctly', () => {
    const result = formatConversionRate('USDC', 'XLM', 10.53)
    expect(result).toContain('10.530000')
  })
})

// ─── Property-Based Tests: Round-Trip Conversion ─────────────────────────────

describe('Round-Trip Conversion Property', () => {
  it('should round-trip correctly for representative amounts and rates', () => {
    const cases: Array<[string, number]> = [
      ['100', 0.095],
      ['1', 10.53],
      ['0.5', 1],
      ['1234.567890', 0.5],
      ['0.000001', 2],
    ]

    for (const [fromAmountStr, rate] of cases) {
      const toAmount = deriveToAmount(fromAmountStr, rate)
      const roundTripped = deriveFromAmount(toAmount, rate)
      const originalWith6dp = new Decimal(fromAmountStr).toFixed(6)
      expect(new Decimal(roundTripped).minus(originalWith6dp).abs().toNumber()).toBeLessThanOrEqual(
        0.00001,
      )
    }
  })
})
