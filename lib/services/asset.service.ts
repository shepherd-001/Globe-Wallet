import { IAssetService, AssetCode, CryptoAsset, AssetServiceError } from '../types'
import { MOCK_CRYPTO_ASSETS, MOCK_CONVERSION_RATES } from '../fixtures'
import { formatCryptoAmount } from '../helpers/format'

export class AssetService implements IAssetService {
  private cache: Map<AssetCode, { price: number; timestamp: number }> = new Map()
  private readonly cacheTTL = 60000

  getAssets(): CryptoAsset[] {
    return MOCK_CRYPTO_ASSETS.map(a => ({ ...a }))
  }

  async getAssetPrice(code: AssetCode): Promise<number> {
    const cached = this.cache.get(code)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < this.cacheTTL) {
      return cached.price
    }

    const asset = MOCK_CRYPTO_ASSETS.find(a => a.code === code)
    if (!asset) {
      throw new AssetServiceError(`Asset ${code} not found`)
    }

    const price = asset.priceUsd
    this.cache.set(code, { price, timestamp: now })
    return price
  }

  convertAsset(from: AssetCode, to: AssetCode, amount: number): number {
    if (!MOCK_CONVERSION_RATES[from] || !MOCK_CONVERSION_RATES[from][to]) {
      throw new AssetServiceError(`Conversion rate not available for ${from} to ${to}`)
    }

    return amount * MOCK_CONVERSION_RATES[from][to]
  }

  formatAsset(amount: number, code: AssetCode, hidden = false): string {
    return formatCryptoAmount(amount, code, hidden)
  }
}
