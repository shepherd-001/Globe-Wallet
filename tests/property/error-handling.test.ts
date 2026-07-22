import fc from 'fast-check'
import { AssetService } from '../../lib/services/asset.service'
import { FiatService } from '../../lib/services/fiat.service'
import { FiatServiceError } from '../../lib/types'

describe('Error Handling Properties', () => {
  const assetService = new AssetService()
  const fiatService = new FiatService()

  it('Property 4: Services should handle invalid inputs gracefully', () => {
    expect(() => {
      assetService.convertAsset('INVALID' as any, 'XLM', 10)
    }).toThrow()
  })

  it('Property 4: FiatService should handle invalid currencies', () => {
    fc.assert(fc.property(
      fc.string({ maxLength: 5 }).filter(s => !['NGN', 'USD', 'GBP', 'EUR'].includes(s)),
      fc.double({ min: 0.01, max: 1000, noNaN: true }),
      (invalidCurrency, amount) => {
        expect(() => {
          fiatService.convertCurrency(invalidCurrency as any, 'USD', amount)
        }).toThrow(FiatServiceError)
      }
    ), { numRuns: 100 })
  })
})
