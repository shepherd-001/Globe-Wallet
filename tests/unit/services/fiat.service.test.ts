import { FiatService } from '../../../lib/services/fiat.service'
import { StellarServiceError } from '../../../lib/types'

describe('FiatService', () => {
  let service: FiatService

  beforeEach(() => {
    service = new FiatService()
  })

  describe('getWallets', () => {
    it('should return all wallets', () => {
      const wallets = service.getWallets()
      expect(wallets).toHaveLength(3)
      expect(wallets[0].code).toBe('NGN')
    })
  })

  describe('formatMoney', () => {
    it('should format NGN correctly', () => {
      const formatted = service.formatMoney(1234.56, 'NGN')
      expect(formatted).toBe('₦1,234.56')
    })

    it('should format USD correctly', () => {
      const formatted = service.formatMoney(1234.56, 'USD')
      expect(formatted).toBe('$1,234.56')
    })

    it('should hide amounts when requested', () => {
      const formatted = service.formatMoney(1234.56, 'USD', true)
      expect(formatted).toBe('$••••••')
    })
  })

  describe('convertCurrency', () => {
    it('should convert currencies correctly', () => {
      const result = service.convertCurrency('USD', 'NGN', 100)
      expect(result).toBe(158050)
    })

    it('should throw error for invalid conversion', () => {
      expect(() => service.convertCurrency('INVALID' as any, 'USD', 100))
        .toThrow(StellarServiceError)
    })
  })

  describe('getAccountBalance', () => {
    it('should return aggregate USD balance', () => {
      const balance = service.getAccountBalance()
      expect(balance).toBeGreaterThan(0)
    })
  })
})
