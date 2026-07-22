import { WalletService } from '../../../lib/services/wallet.service'
import { WalletServiceError } from '../../../lib/types'
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-base'
import { initTracing } from '../../../lib/tracing/tracer'

describe('WalletService', () => {
    let service: WalletService

    beforeEach(() => {
        service = new WalletService()
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ success: true, hash: '0xhash123', status: 'completed' })
        })
    })

    describe('getAccountInfo', () => {
        it('should return account info', () => {
            const account = service.getAccountInfo()
            expect(account.publicKey).toBe('GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX')
            expect(account.network).toContain('Stellar')
        })
    })

    describe('getBalance', () => {
        it('should return balances for the account', async () => {
            const balances = await service.getBalance()
            expect(balances).toBeDefined()
            expect(balances.length).toBeGreaterThan(0)
            expect(balances[0]).toHaveProperty('asset')
            expect(balances[0]).toHaveProperty('amount')
        })
    })

    describe('validateAddress', () => {
        it('should validate correct Stellar address', () => {
            const valid = service.validateAddress('GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX')
            expect(valid).toBe(true)
        })

        it('should reject invalid addresses', () => {
            expect(service.validateAddress('invalid')).toBe(false)
            expect(service.validateAddress('')).toBe(false)
        })
    })

    describe('shortenKey', () => {
        it('should shorten keys correctly', () => {
            const shortened = service.shortenKey('GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX')
            expect(shortened).toBe('GDXSPA…T6BNRX')
        })
    })

    describe('sendPayment', () => {
        it('should execute a payment successfully', async () => {
            const result = await service.sendPayment(
                'GC3G2N7N5LRYX6L5N2YHV3K2L9P8QW1ZC4T6BNRYX7QK3MUKXHV2RZ4D',
                100,
                'XLM'
            )
            expect(result.status).toBe('completed')
            expect(result.hash).toBeDefined()
        })

        it('should throw error for zero amount', async () => {
            await expect(service.sendPayment('address', 0, 'XLM'))
                .rejects.toThrow(WalletServiceError)
        })
    })

    describe('trace propagation (Issue #103)', () => {
        const exporter = new InMemorySpanExporter()

        beforeAll(() => {
            initTracing(exporter)
        })

        beforeEach(() => {
            exporter.reset()
        })

        it('propagates a W3C traceparent header on the real /api/wallet/send call', async () => {
            await service.sendPayment(
                'GC3G2N7N5LRYX6L5N2YHV3K2L9P8QW1ZC4T6BNRYX7QK3MUKXHV2RZ4D',
                100,
                'XLM'
            )

            const [, init] = (global.fetch as jest.Mock).mock.calls[0]
            const headers = init.headers as Headers
            expect(headers.get('traceparent')).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/)

            const spans = exporter.getFinishedSpans()
            const sendSpan = spans.find((s) => s.name === 'WalletService.sendPayment')
            expect(sendSpan).toBeDefined()

            const [, traceIdFromHeader] = headers.get('traceparent')!.split('-')
            expect(traceIdFromHeader).toBe(sendSpan!.spanContext().traceId)
        })
    })
})
