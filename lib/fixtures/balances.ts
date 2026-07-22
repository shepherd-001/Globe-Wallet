import type { Balance, AssetCode } from '../types'

export const MOCK_BALANCES: Balance[] = [
  { asset: 'XLM' as AssetCode, amount: 4250.5, priceUsd: 0.1185 },
  { asset: 'USDC' as AssetCode, amount: 1820.0, priceUsd: 1.0 },
  { asset: 'USDT' as AssetCode, amount: 540.25, priceUsd: 1.0 },
]

export const MOCK_TOTAL_USD_VALUE = 4250.5 * 0.1185 + 1820.0 * 1.0 + 540.25 * 1.0
