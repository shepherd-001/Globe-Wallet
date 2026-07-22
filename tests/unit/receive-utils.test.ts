import {
  buildAddressQRValue,
  buildPaymentRequestQR,
  buildReceiveQRData,
  formatAddressShareText,
  formatPaymentRequestShareText,
  validatePaymentAmount,
} from '../../lib/receive-utils'
import { TEST_STELLAR_ADDRESS } from '../../lib/finance-data'

describe('receive-utils', () => {
  describe('buildAddressQRValue', () => {
    it('returns the plain Stellar public key', () => {
      expect(buildAddressQRValue(TEST_STELLAR_ADDRESS)).toBe(TEST_STELLAR_ADDRESS)
    })
  })

  describe('buildPaymentRequestQR', () => {
    it('builds SEP-0007 URI with destination only', () => {
      const uri = buildPaymentRequestQR({ address: TEST_STELLAR_ADDRESS })
      expect(uri).toBe(`web+stellar:pay?destination=${TEST_STELLAR_ADDRESS}`)
    })

    it('includes amount and memo query params', () => {
      const uri = buildPaymentRequestQR({
        address: TEST_STELLAR_ADDRESS,
        amount: '25.5',
        memo: 'Invoice 42',
      })
      expect(uri).toContain('destination=')
      expect(uri).toContain('amount=25.5')
      expect(uri).toContain('memo_type=text')
      expect(uri).toContain('memo=Invoice')
    })

    it('includes asset_code for non-XLM assets', () => {
      const uri = buildPaymentRequestQR({
        address: TEST_STELLAR_ADDRESS,
        amount: '10',
        asset: 'USDC',
      })
      expect(uri).toContain('asset_code=USDC')
    })

    it('omits malformed amounts instead of embedding invalid QR data', () => {
      const uri = buildPaymentRequestQR({
        address: TEST_STELLAR_ADDRESS,
        amount: '10abc',
      })
      expect(uri).toBe(`web+stellar:pay?destination=${TEST_STELLAR_ADDRESS}`)
      expect(uri).not.toContain('amount=')
    })

    it('omits amounts with separators or more than 7 decimal places', () => {
      expect(
        buildPaymentRequestQR({ address: TEST_STELLAR_ADDRESS, amount: '1,000' })
      ).not.toContain('amount=')
      expect(
        buildPaymentRequestQR({ address: TEST_STELLAR_ADDRESS, amount: '1.123456789' })
      ).not.toContain('amount=')
    })

    it('omits non-positive or out-of-range amounts', () => {
      expect(
        buildPaymentRequestQR({ address: TEST_STELLAR_ADDRESS, amount: '0' })
      ).not.toContain('amount=')
      expect(
        buildPaymentRequestQR({ address: TEST_STELLAR_ADDRESS, amount: '-5' })
      ).not.toContain('amount=')
      expect(
        buildPaymentRequestQR({ address: TEST_STELLAR_ADDRESS, amount: '1000000001' })
      ).not.toContain('amount=')
    })

    it('omits memos that exceed the SEP-0007 28-byte MEMO_TEXT limit', () => {
      const uri = buildPaymentRequestQR({
        address: TEST_STELLAR_ADDRESS,
        memo: 'this memo is far too long for stellar',
      })
      expect(uri).not.toContain('memo=')
      expect(uri).not.toContain('memo_type=')
    })

    it('keeps a well-formed amount and memo together', () => {
      const uri = buildPaymentRequestQR({
        address: TEST_STELLAR_ADDRESS,
        amount: '25.1234567',
        memo: 'Invoice 42',
      })
      expect(uri).toContain('amount=25.1234567')
      expect(uri).toContain('memo_type=text')
      expect(uri).toContain('memo=Invoice')
    })
  })

  describe('formatPaymentRequestShareText', () => {
    it('formats address-only share text', () => {
      expect(formatPaymentRequestShareText({ address: TEST_STELLAR_ADDRESS })).toBe(
        `Send XLM to: ${TEST_STELLAR_ADDRESS}`
      )
    })

    it('includes amount and memo when provided', () => {
      const text = formatPaymentRequestShareText({
        address: TEST_STELLAR_ADDRESS,
        amount: '10',
        memo: 'Rent',
      })
      expect(text).toContain('Amount: 10 XLM')
      expect(text).toContain('Memo: Rent')
    })
  })

  describe('formatAddressShareText', () => {
    it('formats address share message', () => {
      expect(formatAddressShareText(TEST_STELLAR_ADDRESS)).toContain(TEST_STELLAR_ADDRESS)
    })
  })

  describe('validatePaymentAmount', () => {
    it('accepts empty optional amount', () => {
      expect(validatePaymentAmount('')).toEqual({ valid: true })
      expect(validatePaymentAmount('   ')).toEqual({ valid: true })
    })

    it('rejects invalid numeric input', () => {
      expect(validatePaymentAmount('abc')).toEqual({
        valid: false,
        error: 'Please enter a valid amount',
      })
    })

    it('rejects zero and negative amounts', () => {
      expect(validatePaymentAmount('0')).toEqual({
        valid: false,
        error: 'Amount must be greater than zero',
      })
      expect(validatePaymentAmount('-5')).toEqual({
        valid: false,
        error: 'Amount must be greater than zero',
      })
    })

    it('rejects amounts above maximum', () => {
      expect(validatePaymentAmount('1000000001')).toEqual({
        valid: false,
        error: 'Amount exceeds maximum allowed value',
      })
    })

    it('accepts valid positive amounts', () => {
      expect(validatePaymentAmount('10.5')).toEqual({ valid: true })
    })
  })

  describe('buildReceiveQRData', () => {
    it('builds address QR metadata', () => {
      const data = buildReceiveQRData(TEST_STELLAR_ADDRESS, 'address')
      expect(data.type).toBe('address')
      expect(data.value).toBe(TEST_STELLAR_ADDRESS)
      expect(data.address).toBe(TEST_STELLAR_ADDRESS)
    })

    it('builds payment request QR metadata', () => {
      const data = buildReceiveQRData(TEST_STELLAR_ADDRESS, 'payment-request', '5', 'Note')
      expect(data.type).toBe('payment-request')
      expect(data.amount).toBe('5')
      expect(data.memo).toBe('Note')
      expect(data.value).toContain('web+stellar:pay')
    })
  })
})
