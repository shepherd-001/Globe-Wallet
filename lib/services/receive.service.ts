import {
  AssetCode,
  IWalletService,
  PaymentRequestPayload,
  PaymentRequestResponse,
  ReceiveAddressResponse,
} from '../types'
import {
  buildPaymentRequestQR,
  formatPaymentRequestShareText,
  validatePaymentAmount,
} from '../receive-utils'
import { BaseService } from './base.service'

/**
 * Receive service — address lookup and payment-request QR generation.
 */
export class ReceiveService extends BaseService {
  constructor(private readonly wallet: IWalletService) {
    super('ReceiveService')
  }

  getReceiveAddress(): ReceiveAddressResponse {
    const address = this.wallet.generateReceiveAddress()
    if (!this.wallet.validateAddress(address)) {
      return { success: false, error: 'Invalid receive address' }
    }
    return { success: true, address }
  }

  createPaymentRequest(payload: PaymentRequestPayload = {}): PaymentRequestResponse {
    const { amount = '', memo = '', asset = 'XLM' } = payload
    const addressResult = this.getReceiveAddress()

    if (!addressResult.success || !addressResult.address) {
      return { success: false, error: addressResult.error ?? 'Unable to resolve receive address' }
    }

    const validation = validatePaymentAmount(amount)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const address = addressResult.address
    const qrValue = buildPaymentRequestQR({ address, amount, memo, asset: asset as AssetCode })
    const shareText = formatPaymentRequestShareText({ address, amount, memo })

    return {
      success: true,
      address,
      qrValue,
      shareText,
    }
  }
}
