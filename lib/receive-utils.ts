import {
  AssetCode,
  PaymentAmountValidation,
  PaymentRequest,
  ReceiveQRData,
} from './types'

const MAX_PAYMENT_AMOUNT = 1_000_000_000

/** Stellar amounts allow up to 7 decimal places and no separators/exponents */
const STELLAR_AMOUNT_PATTERN = /^\d+(\.\d{1,7})?$/

/** SEP-0007 MEMO_TEXT is capped at 28 bytes */
const MAX_MEMO_BYTES = 28

/** Whether a trimmed amount string is a well-formed, in-range Stellar amount */
function isWellFormedAmount(amount: string): boolean {
  if (!STELLAR_AMOUNT_PATTERN.test(amount)) {
    return false
  }
  const num = parseFloat(amount)
  return num > 0 && num <= MAX_PAYMENT_AMOUNT
}

/** UTF-8 byte length without relying on TextEncoder/Buffer being globally available */
function utf8ByteLength(value: string): number {
  let bytes = 0
  for (let i = 0; i < value.length; i++) {
    const codePoint = value.codePointAt(i) as number
    if (codePoint > 0xffff) i++ // surrogate pair already counted as one code point
    if (codePoint <= 0x7f) bytes += 1
    else if (codePoint <= 0x7ff) bytes += 2
    else if (codePoint <= 0xffff) bytes += 3
    else bytes += 4
  }
  return bytes
}

/** Whether a trimmed memo fits within Stellar's MEMO_TEXT byte limit */
function isWellFormedMemo(memo: string): boolean {
  return utf8ByteLength(memo) <= MAX_MEMO_BYTES
}

/** Plain Stellar public key for address-only QR codes */
export function buildAddressQRValue(address: string): string {
  return address
}

/** SEP-0007 payment URI for wallet-compatible payment request QR codes */
export function buildPaymentRequestQR(params: PaymentRequest): string {
  const { address, amount, memo, asset = 'XLM' } = params
  const searchParams = new URLSearchParams()
  searchParams.set('destination', address)

  const trimmedAmount = amount?.trim()
  if (trimmedAmount && isWellFormedAmount(trimmedAmount)) {
    searchParams.set('amount', trimmedAmount)
  }

  const trimmedMemo = memo?.trim()
  if (trimmedMemo && isWellFormedMemo(trimmedMemo)) {
    searchParams.set('memo_type', 'text')
    searchParams.set('memo', trimmedMemo)
  }

  if (asset !== 'XLM') {
    searchParams.set('asset_code', asset)
  }

  return `web+stellar:pay?${searchParams.toString()}`
}

export function formatPaymentRequestShareText(params: {
  address: string
  amount?: string
  memo?: string
}): string {
  let text = `Send XLM to: ${params.address}`
  if (params.amount?.trim()) {
    text += `\nAmount: ${params.amount.trim()} XLM`
  }
  if (params.memo?.trim()) {
    text += `\nMemo: ${params.memo.trim()}`
  }
  return text
}

export function formatAddressShareText(address: string): string {
  return `Send XLM to: ${address}`
}

export function validatePaymentAmount(amount: string): PaymentAmountValidation {
  if (!amount.trim()) {
    return { valid: true }
  }

  const num = parseFloat(amount)
  if (Number.isNaN(num)) {
    return { valid: false, error: 'Please enter a valid amount' }
  }
  if (num <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' }
  }
  if (num > MAX_PAYMENT_AMOUNT) {
    return { valid: false, error: 'Amount exceeds maximum allowed value' }
  }

  return { valid: true }
}

export function buildReceiveQRData(
  address: string,
  type: ReceiveQRData['type'],
  amount = '',
  memo = '',
  asset: AssetCode = 'XLM'
): ReceiveQRData {
  const value =
    type === 'address'
      ? buildAddressQRValue(address)
      : buildPaymentRequestQR({ address, amount, memo, asset })

  return {
    value,
    type,
    address,
    amount: amount.trim() || undefined,
    memo: memo.trim() || undefined,
  }
}
