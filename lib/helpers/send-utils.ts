/**
 * lib/helpers/send-utils.ts — Issue #11
 * Pure helpers for the crypto-native send flow: federated address detection,
 * send-input validation, and display formatting.
 * All functions are stateless and fully unit-testable.
 */

import { isValidStellarAddress } from './format'

// ── isFederatedAddress ────────────────────────────────────────────────────────

/**
 * Returns true if the input looks like a Stellar federated address
 * (i.e. `user*domain.tld`).
 * This is a structural check only — it does not verify that the record exists.
 *
 * @example isFederatedAddress('alice*stellar.org')  // true
 * @example isFederatedAddress('GDXSPA…')            // false
 * @example isFederatedAddress('not*valid')           // false (no TLD)
 */
export function isFederatedAddress(input: string): boolean {
  if (!input || typeof input !== 'string') return false
  const trimmed = input.trim()
  // Must have exactly one `*`, a non-empty local part, and a domain with a dot
  return /^[^*\s@]+\*[^*\s]+\.[^*\s.]+$/.test(trimmed)
}

// ── validateSendInput ─────────────────────────────────────────────────────────

export interface SendInputValidation {
  valid: boolean
  error?: string
}

/**
 * Validates the address and raw amount fields of the send form.
 * Federated addresses (`user*domain`) bypass Stellar address format checks
 * because resolution happens asynchronously; the caller must verify
 * `lookupResult.status === 'resolved'` before submitting.
 *
 * @param address     Raw address string entered by the user
 * @param rawAmount   Raw amount string entered by the user
 * @returns           `{ valid: true }` or `{ valid: false, error: '...' }`
 */
export function validateSendInput(
  address: string,
  rawAmount: string,
): SendInputValidation {
  const trimmedAddress = (address ?? '').trim()

  if (!trimmedAddress) {
    return { valid: false, error: 'Recipient address is required.' }
  }

  // Federated addresses are deferred — structural format only, no G-key check
  if (!isFederatedAddress(trimmedAddress) && !isValidStellarAddress(trimmedAddress)) {
    return {
      valid: false,
      error: 'Invalid Stellar address. Must be 56 characters starting with G.',
    }
  }

  const numAmount = parseFloat(rawAmount)
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Please enter a valid amount greater than zero.' }
  }

  return { valid: true }
}

// ── formatFederatedDisplay ────────────────────────────────────────────────────

/**
 * Formats a federated address pair for display in the confirmation summary.
 * When a resolved key is available, shows `user*domain → GABCDE…WXYZ`.
 *
 * @example formatFederatedDisplay('alice*stellar.org', 'GDXSPA…BNRX')
 *          // 'alice*stellar.org → GDXSPA…BNRX'
 */
export function formatFederatedDisplay(input: string, resolved?: string): string {
  if (!resolved) return input
  const short = `${resolved.slice(0, 8)}…${resolved.slice(-6)}`
  return `${input} → ${short}`
}
