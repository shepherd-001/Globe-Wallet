import { NextRequest, NextResponse } from 'next/server'
import type { TransactionResult } from '@/lib/types'
import { TEST_STELLAR_ADDRESS } from '@/lib/fixtures'
import { validateBearerToken } from '@/lib/auth'

interface SendBody {
  destination?: string
  amount?: number
  asset?: string
  memo?: string
}

export async function POST(request: NextRequest) {
  if (!validateBearerToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SendBody = {}

  try {
    body = (await request.json()) as SendBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { destination, amount, asset } = body

  if (!destination || typeof destination !== 'string') {
    return NextResponse.json(
      { error: 'ERR_INVALID_ADDRESS: destination is required' },
      { status: 422 },
    )
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json(
      { error: 'ERR_INVALID_AMOUNT: amount must be a positive number' },
      { status: 422 },
    )
  }

  if (!asset || typeof asset !== 'string') {
    return NextResponse.json(
      { error: 'ERR_MISSING_ASSET: asset is required' },
      { status: 422 },
    )
  }

  const stellarRegex = /^G[A-Z0-9]{55}$/i
  if (!stellarRegex.test(destination)) {
    return NextResponse.json(
      { error: 'ERR_INVALID_ADDRESS: not a valid Stellar public key' },
      { status: 422 },
    )
  }

  const hash = `0x${Math.random().toString(16).slice(2, 66)}`

  const result: TransactionResult = {
    success: true,
    hash,
    status: 'completed',
  }

  return NextResponse.json(result, { status: 200 })
}
