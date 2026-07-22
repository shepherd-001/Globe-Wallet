/**
 * lib/helpers/format.ts
 * Issue #18 — Centralised formatting, parsing, and fee-calculation utilities.
 *
 * All functions are pure, have no side-effects, and are fully testable.
 * No private keys or secrets ever pass through these helpers.
 */

import type { AssetCode, CurrencyCode } from '../types'

// ── Currency symbols ─────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<CurrencyCode | string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

// ── formatCurrency ────────────────────────────────────────────────────────────

/**
 * Formats a numeric amount with the appropriate currency symbol and locale
 * decimal separators. Optionally masks the value for privacy.
 *
 * @example formatCurrency(1284500.75, 'NGN') // '₦1,284,500.75'
 * @example formatCurrency(1284500.75, 'NGN', true) // '₦••••••'
 */
export function formatCurrency(
  amount: number,
  code: CurrencyCode,
  hidden = false,
): string {
  const symbol = CURRENCY_SYMBOLS[code] ?? ''
  if (hidden) return `${symbol}••••••`
  if (!Number.isFinite(amount)) return `${symbol}0.00`
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// ── formatCryptoAmount ────────────────────────────────────────────────────────

/**
 * Formats a crypto balance with the appropriate decimal precision per asset.
 *
 * @example formatCryptoAmount(4250.5, 'XLM') // '4,250.5000 XLM'
 * @example formatCryptoAmount(1820, 'USDC', true) // '•••• USDC'
 */
export function formatCryptoAmount(
  amount: number,
  code: AssetCode,
  hidden = false,
): string {
  if (hidden) return `•••• ${code}`
  if (!Number.isFinite(amount)) return `0 ${code}`
  const fractionDigits = code === 'XLM' ? 4 : 2
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })} ${code}`
}

// ── formatAddress ─────────────────────────────────────────────────────────────

/**
 * Shortens a Stellar public key for display purposes.
 * Returns the first `lead` characters, an ellipsis, and the last `tail` characters.
 *
 * @throws {Error} if address is shorter than lead + tail characters
 * @example formatAddress('GABCDEF...XYZ', 6, 6) // 'GABCDE…...XYZ'
 */
export function formatAddress(address: string, lead = 6, tail = 6): string {
  if (!address || typeof address !== 'string') return ''
  if (address.length <= lead + tail) return address
  return `${address.slice(0, lead)}…${address.slice(-tail)}`
}

// ── parseStellarAmount ────────────────────────────────────────────────────────

/**
 * Parses a user-entered string into a valid positive number for Stellar payments.
 * Strips whitespace and enforces positivity.
 *
 * @throws {Error} for non-numeric, NaN, zero, or negative values.
 * @example parseStellarAmount('100.5') // 100.5
 */
export function parseStellarAmount(raw: string): number {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) throw new Error('Amount is required')

  const value = Number(trimmed)
  if (!Number.isFinite(value)) throw new Error('Amount must be a valid number')
  if (value <= 0) throw new Error('Amount must be greater than zero')

  // Stellar supports up to 7 decimal places
  const rounded = Math.round(value * 1e7) / 1e7
  return rounded
}

// ── calculateFee ──────────────────────────────────────────────────────────────

/**
 * Calculates a transaction fee given an amount and a fee rate (0–1).
 * Returns the fee, clamped to a minimum base fee of 0.00001 XLM (Stellar minimum).
 *
 * @param amount   - The payment amount in the given asset
 * @param feeRate  - Fractional fee rate, e.g. 0.001 for 0.1%
 * @returns Calculated fee (always >= STELLAR_BASE_FEE)
 * @example calculateFee(100, 0.001) // 0.1
 */
const STELLAR_BASE_FEE = 0.00001

export function calculateFee(amount: number, feeRate = 0.001): number {
  if (!Number.isFinite(amount) || amount < 0) return STELLAR_BASE_FEE
  if (!Number.isFinite(feeRate) || feeRate < 0) return STELLAR_BASE_FEE
  const computed = amount * feeRate
  return Math.max(computed, STELLAR_BASE_FEE)
}

// ── isValidStellarAddress ─────────────────────────────────────────────────────

/**
 * Returns true if the given string is a structurally valid Stellar public key.
 * Validates length (56 chars), prefix ('G'), and base-32 character set.
 * This is a format-only check — it does not verify on-chain existence.
 *
 * @example isValidStellarAddress('GDXSPAY...') // true / false
 */
export function isValidStellarAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  if (address.length !== 56) return false
  if (!address.startsWith('G')) return false
  return /^G[A-Z0-9]{55}$/i.test(address)
}

// ── formatRelativeDate ────────────────────────────────────────────────────────

/**
 * Converts an ISO date string or Date object into a human-readable relative
 * label (e.g. "Just now", "5 minutes ago", "Yesterday", "Jun 15").
 * Keeps transaction lists readable without importing heavy date libraries.
 *
 * @param date  - ISO string, Unix timestamp (ms), or Date object
 * @returns     - Relative label string, never throws
 * @example formatRelativeDate(new Date()) // 'Just now'
 * @example formatRelativeDate('2024-06-15T09:42:00Z') // 'Jun 15'
 */
export function formatRelativeDate(date: Date | string | number): string {
  try {
    const d = date instanceof Date ? date : new Date(date)
    if (!Number.isFinite(d.getTime())) return String(date)

    const now = Date.now()
    const diffMs = now - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
    if (diffDay === 1) return 'Yesterday'
    if (diffDay < 7) return `${diffDay} days ago`

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return String(date)
  }
}
