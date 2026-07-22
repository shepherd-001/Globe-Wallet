/**
 * POST /api/wallet/send
 * Issue #18 — Accepts a send-payment payload, validates it, and returns a
 * mocked TransactionResult. In production this would call the Stellar Horizon API.
 *
 * Security: No private keys are accepted or returned by this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { TransactionResult } from '@/lib/types'
import { context, extractTraceContext, withSpan } from '@/lib/tracing/tracer'

interface SendBody {
  destination?: string
  amount?: number
  asset?: string
  memo?: string
}

export async function POST(request: NextRequest) {
  // Issue #103: continue the caller's trace (from wallet.service.ts's
  // traceparent header) instead of starting a disconnected server-side trace.
  const parentContext = extractTraceContext(request.headers)

  return context.with(parentContext, () =>
    withSpan('api.wallet.send', () => handleSend(request), { 'http.route': '/api/wallet/send' }),
  )
}

async function handleSend(request: NextRequest) {
  let body: SendBody = {}

  try {
    body = (await request.json()) as SendBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { destination, amount, asset } = body

  // Validate required fields
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

  // Validate Stellar address format
  const stellarRegex = /^G[A-Z0-9]{55}$/i
  if (!stellarRegex.test(destination)) {
    return NextResponse.json(
      { error: 'ERR_INVALID_ADDRESS: not a valid Stellar public key' },
      { status: 422 },
    )
  }

  // Simulate processing delay (non-blocking)
  const hash = `0x${Math.random().toString(16).slice(2, 66)}`

  const result: TransactionResult = {
    success: true,
    hash,
    status: 'completed',
  }

  return NextResponse.json(result, { status: 200 })
}
