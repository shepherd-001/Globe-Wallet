import fc from 'fast-check'
import { WalletService } from '../../lib/services/wallet.service'
import { PricingService } from '../../lib/services/pricing.service'
import { FiatService } from '../../lib/services/fiat.service'
import { FinanceServiceContainer } from '../../lib/services/container'
import { TEST_STELLAR_ADDRESS } from '../../lib/finance-data'

describe('Type System Correctness Properties', () => {
  const walletService = new WalletService()
  const pricingService = new PricingService()
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

        const assetFormatted = pricingService.formatAsset(amount, assetCode as any)
        const fiatFormatted = fiatService.formatMoney(amount, currencyCode as any)

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
      fc.constantFrom('NGN', 'USD', 'GBP'),
      fc.double({ min: 0.01, max: 1000, noNaN: true }),
      (toCurrency, amount) => {
        if (toCurrency !== 'USD') {
          const converted = fiatService.convertCurrency('USD', toCurrency as any, amount)
          expect(typeof converted).toBe('number')
          expect(converted).toBeGreaterThan(0)
          expect(Number.isFinite(converted)).toBe(true)
        }

        expect(walletService.validateAddress(TEST_STELLAR_ADDRESS)).toBe(true)
      }
    ), { numRuns: 100 })
  })
})
