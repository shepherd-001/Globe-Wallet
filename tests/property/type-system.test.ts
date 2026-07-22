import fc from 'fast-check'
import { WalletService } from '../../lib/services/wallet.service'
import { PricingService } from '../../lib/services/pricing.service'
import { AssetService } from '../../lib/services/asset.service'
import { FiatService } from '../../lib/services/fiat.service'
import { AssetCode, CurrencyCode } from '../../lib/types'
import { FinanceServiceContainer } from '../../lib/services/container'

describe('Type System Correctness Properties', () => {
  const walletService = new WalletService()
  const pricingService = new PricingService()
  const assetService = new AssetService()
  const fiatService = new FiatService()
  const container = new FinanceServiceContainer()

  it('Property 5: All service operations should maintain type safety', () => {
    fc.assert(fc.property(
      fc.constantFrom('XLM', 'USDC', 'USDT'),
      fc.constantFrom('NGN', 'USD', 'GBP'),
      fc.double({ min: 0.01, max: 10000, noNaN: true }),
      (assetCode, currencyCode, amount) => {
        const assets = pricingService.getAssets()
        expect(assets).toBeInstanceOf(Array)
        expect(assets.every(a => typeof a.code === 'string')).toBe(true)
        expect(assets.every(a => typeof a.balance === 'number')).toBe(true)

        const wallets = fiatService.getWallets()
        expect(wallets).toBeInstanceOf(Array)
        expect(wallets.every(w => typeof w.code === 'string')).toBe(true)
        expect(wallets.every(w => typeof w.balance === 'number')).toBe(true)

        const account = walletService.getAccountInfo()
        expect(typeof account.publicKey).toBe('string')
        expect(typeof account.isFunded).toBe('boolean')

        const assetFormatted = pricingService.formatAsset(amount, assetCode as AssetCode)
        const fiatFormatted = fiatService.formatMoney(amount, currencyCode as CurrencyCode)

        expect(typeof assetFormatted).toBe('string')
        expect(typeof fiatFormatted).toBe('string')
      }
    ), { numRuns: 100 })
  })

  it('Property 5: Service container maintains interface contracts', () => {
    fc.assert(fc.property(
      fc.constantFrom('wallet', 'fiat', 'pricing'),
      (serviceType) => {
        expect(container).toHaveProperty(serviceType)

        switch (serviceType) {
          case 'wallet':
            expect(typeof container.wallet.getAccountInfo).toBe('function')
            expect(typeof container.wallet.validateAddress).toBe('function')
            break
          case 'fiat':
            expect(typeof container.fiat.getWallets).toBe('function')
            expect(typeof container.fiat.formatMoney).toBe('function')
            break
          case 'pricing':
            expect(typeof container.pricing.getAssets).toBe('function')
            expect(typeof container.pricing.formatAsset).toBe('function')
            break
        }
      }
    ), { numRuns: 100 })
  })

  it('Property 5: Conversion operations maintain numerical integrity', () => {
    fc.assert(fc.property(
      fc.constantFrom('XLM', 'USDC', 'USDT'),
      fc.constantFrom('NGN', 'USD', 'GBP'), 
      fc.double({ min: 0.01, max: 1000, noNaN: true }),
      (fromAsset, toCurrency, amount) => {
        // Asset conversions should return valid numbers
        if (fromAsset !== 'XLM') {
          const converted = container.asset.convertAsset(fromAsset as AssetCode, 'XLM', amount)
          expect(typeof converted).toBe('number')
          expect(converted).toBeGreaterThan(0)
          expect(Number.isFinite(converted)).toBe(true)
        }

        // Fiat conversions should return valid numbers
        if (toCurrency !== 'USD') { // Avoid same-currency conversion
          const converted = fiatService.convertCurrency('USD', toCurrency as CurrencyCode, amount)
          expect(typeof converted).toBe('number')
          expect(converted).toBeGreaterThan(0)
          expect(Number.isFinite(converted)).toBe(true)
        }

        // Exchange rates should be positive numbers
        const rate = fiatService.getExchangeRate('USD', toCurrency as CurrencyCode)
        expect(typeof rate).toBe('number')
        expect(rate).toBeGreaterThan(0)
        expect(Number.isFinite(rate)).toBe(true)
      }
    ), { numRuns: 100 })
  })
})
