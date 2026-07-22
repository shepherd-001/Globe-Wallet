import type { AssetCode, CurrencyCode } from '../types'

// Canonical off-ramp fiat rates. Single source of truth — previously
// duplicated (and diverging) between stellar.service.ts and
// off-ramp.service.ts, which meant the quote a user saw depended on
// which code path ran, and GBP was silently missing from the live path.
export const OFF_RAMP_RATES: Record<CurrencyCode, number> = {
  NGN: 1500.0,
  USD: 1.0,
  EUR: 0.92,
  GBP: 1.27,
}

export const MOCK_CONVERSION_RATES: Record<AssetCode, Record<AssetCode, number>> = {
  XLM: { XLM: 1, USDC: 0.1185, USDT: 0.1184, NGN: 177.75, USD: 0.1185, EUR: 0.109 },
  USDC: { XLM: 8.4388, USDC: 1, USDT: 0.9994, NGN: 1500.0, USD: 1.0, EUR: 0.92 },
  USDT: { XLM: 8.4459, USDC: 1.0006, USDT: 1, NGN: 1500.0, USD: 1.0, EUR: 0.92 },
  NGN: { XLM: 0.00562, USDC: 0.00067, USDT: 0.00067, NGN: 1, USD: 0.00067, EUR: 0.00061 },
  USD: { XLM: 8.4388, USDC: 1, USDT: 0.9994, NGN: 1500.0, USD: 1.0, EUR: 0.92 },
  EUR: { XLM: 9.1743, USDC: 1.087, USDT: 1.087, NGN: 1630.0, USD: 1.087, EUR: 1.0 },
}

export const MOCK_SIMPLE_RATES: Record<string, number> = {
  XLM_USD: 0.1185,
  USDC_USD: 1.0,
  USDT_USD: 1.0,
  NGN_USD: 0.00063,
  GBP_USD: 1.27,
  EUR_USD: 1.09,
}

export const MOCK_XLM_USD_RATE = 0.1185
