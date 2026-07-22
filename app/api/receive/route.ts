import { NextRequest, NextResponse } from 'next/server'
import { financeServices } from '../../../lib/services/container'
import { ReceiveService } from '../../../lib/services/receive.service'
import {
  PaymentRequestPayload,
  PaymentRequestResponse,
  ReceiveAddressResponse,
} from '../../../lib/types'

const receiveService = new ReceiveService(financeServices.wallet)

export async function GET() {
  try {
    const result = receiveService.getReceiveAddress()
    const status = result.success ? 200 : 422
    return NextResponse.json<ReceiveAddressResponse>(result, { status })
  } catch (error) {
    return NextResponse.json<ReceiveAddressResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequestPayload = await request.json()
    const result = receiveService.createPaymentRequest(body)

    if (!result.success) {
      return NextResponse.json<PaymentRequestResponse>(result, { status: 422 })
    }

    return NextResponse.json<PaymentRequestResponse>(result)
  } catch (error) {
    return NextResponse.json<PaymentRequestResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
