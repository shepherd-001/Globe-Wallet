import { ReceiveService } from '../../../lib/services/receive.service'
import { WalletService } from '../../../lib/services/wallet.service'
import { TEST_STELLAR_ADDRESS } from '../../../lib/finance-data'

describe('ReceiveService', () => {
  let service: ReceiveService

  beforeEach(() => {
    service = new ReceiveService(new WalletService())
  })

  describe('getReceiveAddress', () => {
    it('returns the wallet receive address', () => {
      const result = service.getReceiveAddress()
      expect(result.success).toBe(true)
      expect(result.address).toBe(TEST_STELLAR_ADDRESS)
    })
  })

  describe('createPaymentRequest', () => {
    it('creates a payment request with QR and share text', () => {
      const result = service.createPaymentRequest({ amount: '12', memo: 'Test' })
      expect(result.success).toBe(true)
      expect(result.address).toBe(TEST_STELLAR_ADDRESS)
      expect(result.qrValue).toContain('web+stellar:pay')
      expect(result.qrValue).toContain('amount=12')
      expect(result.shareText).toContain('12 XLM')
      expect(result.shareText).toContain('Test')
    })

    it('rejects invalid amounts', () => {
      const result = service.createPaymentRequest({ amount: '-1' })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/greater than zero/i)
    })

    it('allows memo-only payment requests', () => {
      const result = service.createPaymentRequest({ memo: 'Reference' })
      expect(result.success).toBe(true)
      expect(result.qrValue).toContain('memo=Reference')
    })
  })

  describe('invalid wallet address', () => {
    it('returns error when generated address fails validation', () => {
      const invalidWallet = {
        generateReceiveAddress: () => 'invalid-address',
        validateAddress: () => false,
      }
      const invalidService = new ReceiveService(invalidWallet as any)
      expect(invalidService.getReceiveAddress()).toEqual({
        success: false,
        error: 'Invalid receive address',
      })
      expect(invalidService.createPaymentRequest({ amount: '1' })).toEqual({
        success: false,
        error: 'Invalid receive address',
      })
    })
  })
})
