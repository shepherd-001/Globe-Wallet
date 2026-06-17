import { NextRequest, NextResponse } from 'next/server'
import { financeServices } from '../../../lib/services/container'

export async function GET() {
  try {
    const assets = financeServices.pricing.getAssets()
    return NextResponse.json({ success: true, data: assets })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { assetCode } = await request.json()
    const price = await financeServices.pricing.getPrice(assetCode)
    return NextResponse.json({ success: true, data: { assetCode, price } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Invalid asset code' },
      { status: 400 }
    )
  }
}