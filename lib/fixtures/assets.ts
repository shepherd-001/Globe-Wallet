import type { CryptoAsset, AssetCode } from '../types'

export const MOCK_CRYPTO_ASSETS: CryptoAsset[] = [
  {
    code: 'XLM' as AssetCode,
    name: 'Stellar Lumens',
    balance: 4250.5,
    priceUsd: 0.1185,
    change24h: 4.7,
    changePct: 4.7,
    color: 'bg-foreground',
  },
  {
    code: 'USDC' as AssetCode,
    name: 'USD Coin',
    balance: 1820.0,
    priceUsd: 1.0,
    change24h: 0.0,
    changePct: 0.0,
    color: 'bg-primary',
  },
  {
    code: 'USDT' as AssetCode,
    name: 'Tether USD',
    balance: 540.25,
    priceUsd: 1.0,
    change24h: 0.01,
    changePct: 0.01,
    color: 'bg-accent',
  },
]

export const SUPPORTED_STELLAR_ASSETS = [
  {
    code: 'XLM' as AssetCode,
    name: 'Stellar Lumens',
    issuer: 'native',
    color: 'bg-foreground',
  },
  {
    code: 'USDC' as AssetCode,
    name: 'USD Coin',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    color: 'bg-primary',
  },
  {
    code: 'USDT' as AssetCode,
    name: 'Tether USD',
    issuer: 'GCQTGZZZ5GNCIRERPBEWHDQO0TG3EFG5BHTO223UOM8F7B3I6T5B5E5W',
    color: 'bg-accent',
  },
]
