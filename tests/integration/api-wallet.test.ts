/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET as balancesGET } from '../../app/api/wallet/balances/route'
import { POST as sendPOST } from '../../app/api/wallet/send/route'
import { GET as transactionsGET } from '../../app/api/wallet/transactions/route'
import { GET as ratesGET } from '../../app/api/rates/route'
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base'
import { initTracing } from '../../lib/tracing/tracer'

describe('Wallet Mock API Routes Integration', () => {
  describe('/api/wallet/balances', () => {
    it('GET should return list of mock balances', async () => {
      const response = await balancesGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('asset')
      expect(data[0]).toHaveProperty('amount')
      expect(data[0]).toHaveProperty('priceUsd')
    })
  })

  describe('/api/wallet/transactions', () => {
    it('GET should return mock transaction history with category, name, and detail fields', async () => {
      const response = await transactionsGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('category')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('detail')
    })
  })

  describe('/api/rates', () => {
    it('GET should return mock conversion rates', async () => {
      const response = await ratesGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('rates')
      expect(data).toHaveProperty('updatedAt')
      expect(data.rates).toHaveProperty('XLM_USD')
      expect(data.rates).toHaveProperty('NGN_USD')
    })
  })

  describe('/api/wallet/send', () => {
    const validAddr = 'GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX'

    it('POST should execute payment successfully on valid inputs', async () => {
      const request = new NextRequest('http://localhost/api/wallet/send', {
        method: 'POST',
        body: JSON.stringify({
          destination: validAddr,
          amount: 50.5,
          asset: 'XLM',
          memo: 'Integration test'
        })
      })

      const response = await sendPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('hash')
      expect(data).toHaveProperty('status', 'completed')
    })

    it('POST should reject invalid address', async () => {
      const request = new NextRequest('http://localhost/api/wallet/send', {
        method: 'POST',
        body: JSON.stringify({
          destination: 'invalid-stellar-key',
          amount: 50.5,
          asset: 'XLM'
        })
      })

      const response = await sendPOST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('not a valid Stellar public key')
    })

    it('POST should reject missing address', async () => {
      const request = new NextRequest('http://localhost/api/wallet/send', {
        method: 'POST',
        body: JSON.stringify({
          amount: 50.5,
          asset: 'XLM'
        })
      })

      const response = await sendPOST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toContain('destination is required')
    })

    it('POST should reject negative or zero amount', async () => {
      const request = new NextRequest('http://localhost/api/wallet/send', {
        method: 'POST',
        body: JSON.stringify({
          destination: validAddr,
          amount: -5,
          asset: 'XLM'
        })
      })

      const response = await sendPOST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toContain('amount must be a positive number')
    })

    it('POST should reject missing asset', async () => {
      const request = new NextRequest('http://localhost/api/wallet/send', {
        method: 'POST',
        body: JSON.stringify({
          destination: validAddr,
          amount: 10
        })
      })

      const response = await sendPOST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toContain('asset is required')
    })

    it('POST should reject malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/wallet/send', {
        method: 'POST',
        body: 'malformed-json-string'
      })

      const response = await sendPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error', 'Invalid JSON body')
    })

    describe('trace propagation (Issue #103)', () => {
      const exporter = new InMemorySpanExporter()

      beforeAll(() => {
        initTracing(exporter)
      })

      beforeEach(() => {
        exporter.reset()
      })

      it('continues the caller trace from an incoming traceparent header instead of starting a new one', async () => {
        const callerTraceId = '4bf92f3577b34da6a3ce929d0e0e4736'
        const callerSpanId = '00f067aa0ba902b7'
        const traceparent = `00-${callerTraceId}-${callerSpanId}-01`

        const request = new NextRequest('http://localhost/api/wallet/send', {
          method: 'POST',
          headers: { traceparent },
          body: JSON.stringify({
            destination: validAddr,
            amount: 25,
            asset: 'XLM',
          }),
        })

        const response = await sendPOST(request)
        expect(response.status).toBe(200)

        const spans = exporter.getFinishedSpans()
        const serverSpan = spans.find((s) => s.name === 'api.wallet.send')
        expect(serverSpan).toBeDefined()
        expect(serverSpan!.spanContext().traceId).toBe(callerTraceId)
        expect(serverSpan!.parentSpanContext?.spanId).toBe(callerSpanId)
      })

      it('starts a fresh trace when no traceparent header is present', async () => {
        const request = new NextRequest('http://localhost/api/wallet/send', {
          method: 'POST',
          body: JSON.stringify({ destination: validAddr, amount: 25, asset: 'XLM' }),
        })

        const response = await sendPOST(request)
        expect(response.status).toBe(200)

        const spans = exporter.getFinishedSpans()
        const serverSpan = spans.find((s) => s.name === 'api.wallet.send')
        expect(serverSpan).toBeDefined()
        expect(serverSpan!.parentSpanContext).toBeUndefined()
      })
    })
  })
})
