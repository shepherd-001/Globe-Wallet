import Decimal from 'decimal.js'

/**
 * lib/helpers/conversion-math.ts — Issue #20
 *
 * Pure, side-effect-free utilities for the Convert page and related components.
 * All functions operate on plain numbers and strings — no service dependencies.
 *
 * Security note: No private keys or secrets ever pass through these helpers.
 *   Use environment variables for API endpoints (e.g. MERGE_ANALYTICS_URL).
 *   Always use testnet credentials in development; never commit mainnet keys.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** Represents a single entry in the page-level exchange rate table. */
export interface ExchangeRate {
  from: string
  to: string
  rate: number
  change24h: number
}

// ── applyConversionRate ───────────────────────────────────────────────────────

/**
 * Calculates the result of converting `amount` at `rate`.
 *
 * @param amount - Source amount (e.g. 100 XLM)
 * @param rate   - Exchange rate (e.g. 0.095 for XLM→USDC)
 * @returns      - Converted amount, or NaN / Infinity following IEEE 754 rules
 *
 * @example
 *   applyConversionRate(100, 0.095) // 9.5
 */
export function applyConversionRate(amount: number, rate: number): number {
  return new Decimal(amount).times(rate).toNumber()
}

// ── applyReverseRate ──────────────────────────────────────────────────────────

/**
 * Back-calculates the source amount given a `toAmount` and `rate`.
 * Used when the user edits the "to" field and we need to populate "from".
 *
 * @param toAmount - The target amount the user wants to receive
 * @param rate     - Exchange rate (must be non-zero)
 * @returns        - Corresponding source amount
 *
 * @example
 *   applyReverseRate(9.5, 0.095) // ≈ 100
 */
export function applyReverseRate(toAmount: number, rate: number): number {
  return new Decimal(toAmount).div(rate).toNumber()
}

// ── applyProcessingFee ────────────────────────────────────────────────────────

/**
 * Deducts a processing fee from an amount and clamps the result to zero.
 *
 * @param amount  - The gross amount before fees
 * @param feeRate - Fractional fee rate, default 0.001 (0.1%)
 * @returns       - Net amount after fee deduction, minimum 0
 *
 * @example
 *   applyProcessingFee(1000)       // 999
 *   applyProcessingFee(1000, 0.02) // 980
 */
export function applyProcessingFee(amount: number, feeRate = 0.001): number {
  if (!Number.isFinite(amount)) return amount
  return Math.max(0, new Decimal(amount).times(1 - feeRate).toNumber())
}

// ── deriveToAmount ────────────────────────────────────────────────────────────

/**
 * Derives the "to" display string from a user-entered "from" amount string and rate.
 * Returns an empty string for invalid / empty inputs rather than throwing.
 *
 * @param fromAmountStr - Raw string from the "from" input (may be empty or malformed)
 * @param rate          - Current exchange rate
 * @returns             - Formatted result string (6dp) or ''
 *
 * @example
 *   deriveToAmount('100', 0.095) // '9.500000'
 *   deriveToAmount('', 0.095)    // ''
 */
export function deriveToAmount(fromAmountStr: string, rate: number): string {
  if (!fromAmountStr || !rate) return ''
  try {
    const num = new Decimal(fromAmountStr)
    if (num.isNaN()) return ''
    return num.times(rate).toFixed(6)
  } catch {
    return ''
  }
}

// ── deriveFromAmount ──────────────────────────────────────────────────────────

/**
 * Derives the "from" display string from a user-entered "to" amount string and rate.
 * Returns an empty string for invalid / empty inputs rather than throwing.
 *
 * @param toAmountStr - Raw string from the "to" input
 * @param rate        - Current exchange rate (must be non-zero)
 * @returns           - Formatted result string (6dp) or ''
 *
 * @example
 *   deriveFromAmount('9.5', 0.095) // '100.000000'
 *   deriveFromAmount('', 0.095)    // ''
 */
export function deriveFromAmount(toAmountStr: string, rate: number): string {
  if (!toAmountStr || !rate) return ''
  try {
    const num = new Decimal(toAmountStr)
    if (num.isNaN()) return ''
    return num.div(rate).toFixed(6)
  } catch {
    return ''
  }
}

// ── lookupRate ────────────────────────────────────────────────────────────────

/**
 * Finds the matching rate entry from an ExchangeRate array.
 *
 * @param rates - Array of available exchange rate entries
 * @param from  - Source currency/asset code
 * @param to    - Target currency/asset code
 * @returns     - Matching ExchangeRate, or null if not found
 *
 * @example
 *   lookupRate(rates, 'XLM', 'USDC') // { from: 'XLM', to: 'USDC', rate: 0.095, ... }
 */
export function lookupRate(
  rates: ExchangeRate[],
  from: string,
  to: string,
): ExchangeRate | null {
  return rates.find((r) => r.from === from && r.to === to) ?? null
}

// ── calculateNetReceived ──────────────────────────────────────────────────────

/**
 * Calculates the final amount the user will receive after the processing fee.
 * Mirrors the "You'll receive" line in the transaction details card.
 *
 * @param toAmountStr - The gross "to" amount string (e.g. '100.000000')
 * @param feeRate     - Fractional processing fee rate (default 0.001 = 0.1%)
 * @returns           - Net amount as a number, or 0 for invalid input
 *
 * @example
 *   calculateNetReceived('100.000000') // 99.9
 */
export function calculateNetReceived(
  toAmountStr: string,
  feeRate = 0.001,
): number {
  if (!toAmountStr) return 0
  try {
    const num = new Decimal(toAmountStr)
    if (num.isNaN()) return 0
    return applyProcessingFee(num.toNumber(), feeRate)
  } catch {
    return 0
  }
}

// ── formatConversionRate ──────────────────────────────────────────────────────

/**
 * Produces the human-readable rate string shown in the exchange rate card.
 *
 * @param from - Source asset/currency code
 * @param to   - Target asset/currency code
 * @param rate - Numeric exchange rate
 * @returns    - Display string, e.g. '1 XLM = 0.095000 USDC'
 *
 * @example
 *   formatConversionRate('XLM', 'USDC', 0.095) // '1 XLM = 0.095000 USDC'
 */
export function formatConversionRate(
  from: string,
  to: string,
  rate: number,
): string {
  return `1 ${from} = ${rate.toFixed(6)} ${to}`
}
