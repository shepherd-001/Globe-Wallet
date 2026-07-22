/**
 * Off-Ramp Payout Validation & Fee Calculation Utilities — Issue #21
 *
 * Pure functions extracted from the off-ramp page so they can be tested
 * in isolation. No React, no side-effects.
 */

import type { AssetCode } from "./types";

// ── Constants ──────────────────────────────────────────────────────────────────

/** Default exchange rates: crypto → USD */
export const DEFAULT_RATES: Record<string, number> = {
  XLM: 0.095,
  USDC: 1.0,
  USDT: 0.998,
};

/** Default mock balances for the off-ramp page */
export const DEFAULT_BALANCES: Record<string, number> = {
  XLM: 1250.45,
  USDC: 89.32,
  USDT: 156.78,
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OffRampPaymentMethod {
  id: string;
  type: "bank" | "card";
  name: string;
  details: string;
  /** e.g. "1.5%", "$15 + 1%", "2.5%" */
  fees: string;
  processingTime: string;
  limits: { min: number; max: number };
  enabled: boolean;
}

export interface PayoutBreakdown {
  cryptoAmount: number;
  asset: string;
  usdValue: number;
  feeAmount: number;
  /** Flat fixed component of the fee, if any */
  fixedFee: number;
  /** Percentage component of the fee (0-1), if any */
  percentFee: number;
  netPayout: number;
  paymentMethodId: string;
}

export type WithdrawalErrorCode =
  | "INVALID_AMOUNT"
  | "NO_PAYMENT_METHOD"
  | "INSUFFICIENT_BALANCE"
  | "BELOW_MIN_LIMIT"
  | "ABOVE_MAX_LIMIT"
  | "METHOD_DISABLED"
  | "METHOD_NOT_FOUND"
  | "UNKNOWN_ASSET";

export interface WithdrawalValidationResult {
  valid: boolean;
  errorCode?: WithdrawalErrorCode;
  errorMessage?: string;
}

export interface WithdrawalInput {
  amount: string | number;
  asset: string;
  paymentMethodId: string;
  balances?: Record<string, number>;
  rates?: Record<string, number>;
  methods?: OffRampPaymentMethod[];
}

// ── Fee Parsing ────────────────────────────────────────────────────────────────

/**
 * Parse a fee string into its fixed and percentage components.
 *
 * Supported formats:
 *   "1.5%"       → { fixedFee: 0, percentFee: 0.015 }
 *   "$15 + 1%"   → { fixedFee: 15, percentFee: 0.01 }
 *   "$15"        → { fixedFee: 15, percentFee: 0 }
 *   "0%"         → { fixedFee: 0, percentFee: 0 }
 */
export function parseFeeString(feeStr: string): {
  fixedFee: number;
  percentFee: number;
} {
  if (!feeStr || typeof feeStr !== "string") {
    return { fixedFee: 0, percentFee: 0 };
  }

  const trimmed = feeStr.trim();

  // Pure percentage: "1.5%"
  if (/^\d+(\.\d+)?%$/.test(trimmed)) {
    return { fixedFee: 0, percentFee: parseFloat(trimmed) / 100 };
  }

  // Fixed only: "$15"
  if (/^\$\d+(\.\d+)?$/.test(trimmed)) {
    return { fixedFee: parseFloat(trimmed.replace("$", "")), percentFee: 0 };
  }

  // Mixed: "$15 + 1%" or "$15+1%"
  const mixedMatch = trimmed.match(/^\$(\d+(?:\.\d+)?)\s*\+\s*(\d+(?:\.\d+)?)%$/);
  if (mixedMatch) {
    return {
      fixedFee: parseFloat(mixedMatch[1]),
      percentFee: parseFloat(mixedMatch[2]) / 100,
    };
  }

  // Fallback: try parsing as a plain number
  const num = parseFloat(trimmed.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(num)) {
    return { fixedFee: num, percentFee: 0 };
  }

  return { fixedFee: 0, percentFee: 0 };
}

// ── Conversion Helpers ─────────────────────────────────────────────────────────

/**
 * Convert a crypto amount to USD using the provided (or default) rates.
 * Returns 0 for invalid inputs.
 */
export function getUSDValue(
  amount: number,
  asset: string,
  rates: Record<string, number> = DEFAULT_RATES,
): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  const rate = rates[asset];
  if (rate === undefined || !Number.isFinite(rate)) return 0;
  return amount * rate;
}

/**
 * Compute the fee amount in USD for a given USD value and fee string.
 */
export function computeFeeAmount(
  usdValue: number,
  feeStr: string,
): { feeAmount: number; fixedFee: number; percentFee: number } {
  if (!Number.isFinite(usdValue) || usdValue < 0) {
    return { feeAmount: 0, fixedFee: 0, percentFee: 0 };
  }
  const { fixedFee, percentFee } = parseFeeString(feeStr);
  const feeAmount = fixedFee + usdValue * percentFee;
  return { feeAmount, fixedFee, percentFee };
}

/**
 * Compute the net payout (USD value minus fee).
 * Never negative — floored at 0.
 */
export function getNetPayout(usdValue: number, feeAmount: number): number {
  const net = usdValue - feeAmount;
  return Math.max(0, net);
}

// ── Full Breakdown ─────────────────────────────────────────────────────────────

/**
 * Produce a full payout breakdown for a given withdrawal.
 * Returns null if the method is not found or inputs are invalid.
 */
export function buildPayoutBreakdown(
  cryptoAmount: number,
  asset: string,
  paymentMethodId: string,
  methods: OffRampPaymentMethod[],
  rates: Record<string, number> = DEFAULT_RATES,
): PayoutBreakdown | null {
  if (!Number.isFinite(cryptoAmount) || cryptoAmount <= 0) return null;

  const method = methods.find((m) => m.id === paymentMethodId);
  if (!method) return null;

  const usdValue = getUSDValue(cryptoAmount, asset, rates);
  const { feeAmount, fixedFee, percentFee } = computeFeeAmount(usdValue, method.fees);
  const netPayout = getNetPayout(usdValue, feeAmount);

  return {
    cryptoAmount,
    asset,
    usdValue,
    feeAmount,
    fixedFee,
    percentFee,
    netPayout,
    paymentMethodId,
  };
}

// ── Validation ─────────────────────────────────────────────────────────────────

const LIMIT_EPS = 1e-9;

/**
 * Validate a withdrawal request against business rules.
 * Returns a result indicating whether the withdrawal is valid, and if not,
 * the specific error code and a human-readable message.
 */
export function validateWithdrawal(
  input: WithdrawalInput,
): WithdrawalValidationResult {
  const {
    amount,
    asset,
    paymentMethodId,
    balances = DEFAULT_BALANCES,
    rates = DEFAULT_RATES,
    methods = [],
  } = input;

  const numericAmount =
    typeof amount === "string" ? Number(amount.trim()) : Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return {
      valid: false,
      errorCode: "INVALID_AMOUNT",
      errorMessage: "Please enter a valid amount greater than zero",
    };
  }

  if (!paymentMethodId || String(paymentMethodId).trim() === "") {
    return {
      valid: false,
      errorCode: "NO_PAYMENT_METHOD",
      errorMessage: "Please select a payment method",
    };
  }

  const method = methods.find((m) => m.id === paymentMethodId);
  if (!method) {
    return {
      valid: false,
      errorCode: "METHOD_NOT_FOUND",
      errorMessage: "Payment method not found",
    };
  }

  if (!method.enabled) {
    return {
      valid: false,
      errorCode: "METHOD_DISABLED",
      errorMessage: `${method.name} is not available`,
    };
  }

  if (rates[asset] === undefined) {
    return {
      valid: false,
      errorCode: "UNKNOWN_ASSET",
      errorMessage: `Unsupported asset: ${asset}`,
    };
  }

  const balance = balances[asset] ?? 0;
  if (numericAmount > balance + LIMIT_EPS) {
    return {
      valid: false,
      errorCode: "INSUFFICIENT_BALANCE",
      errorMessage: `Insufficient ${asset} balance`,
    };
  }

  const usdValue = getUSDValue(numericAmount, asset, rates);
  const min = method.limits?.min ?? 0;
  const max = method.limits?.max ?? Number.POSITIVE_INFINITY;

  if (usdValue + LIMIT_EPS < min) {
    return {
      valid: false,
      errorCode: "BELOW_MIN_LIMIT",
      errorMessage: `Amount must be at least ${formatUSD(min)}`,
    };
  }

  if (usdValue - LIMIT_EPS > max) {
    return {
      valid: false,
      errorCode: "ABOVE_MAX_LIMIT",
      errorMessage: `Amount must be at most ${formatUSD(max)}`,
    };
  }

  return { valid: true };
}

// ── Formatting Helpers ─────────────────────────────────────────────────────────

/**
 * Format a USD amount to two decimal places with "$" prefix.
 * e.g. formatUSD(1234.5678) → "$1,234.57"
 */
export function formatUSD(amount: number): string {
  if (!Number.isFinite(amount)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a percentage fee as a human-readable string.
 * e.g. 0.015 → "1.50%"
 */
export function formatFeePercent(percentFee: number): string {
  if (!Number.isFinite(percentFee)) return "0.00%";
  return `${(percentFee * 100).toFixed(2)}%`;
}

/**
 * Return a human-readable description of the fee given a fee string and USD amount.
 * e.g. "$15 + 1%" with $200 → "$17.00 ($15.00 fixed + $2.00 variable)"
 */
export function describeFee(feeStr: string, usdValue: number): string {
  const { feeAmount, fixedFee, percentFee } = computeFeeAmount(usdValue, feeStr);

  if (fixedFee > 0 && percentFee > 0) {
    const varPart = usdValue * percentFee;
    return `${formatUSD(feeAmount)} (${formatUSD(fixedFee)} fixed + ${formatUSD(varPart)} variable)`;
  }
  if (fixedFee > 0) return `${formatUSD(fixedFee)} flat fee`;
  if (percentFee > 0) return `${formatFeePercent(percentFee)} (${formatUSD(feeAmount)})`;
  return "No fee";
}
