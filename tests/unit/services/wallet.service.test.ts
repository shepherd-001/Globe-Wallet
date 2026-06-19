import { WalletService } from '../../../lib/services/wallet.service'
import { StellarServiceError, WalletServiceError } from '../../../lib/types'
import { TEST_STELLAR_ADDRESS } from '../../../lib/fixtures'

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
            expect(account.publicKey).toBe(TEST_STELLAR_ADDRESS)
            expect(account.isFunded).toBe(true)
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
            const valid = service.validateAddress(TEST_STELLAR_ADDRESS)
            expect(valid).toBe(true)
        })

        it('should reject invalid addresses', () => {
            expect(service.validateAddress('invalid')).toBe(false)
            expect(service.validateAddress('')).toBe(false)
            expect(service.validateAddress('B' + 'A'.repeat(55))).toBe(false)
            expect(service.validateAddress('G' + 'A'.repeat(54))).toBe(false)
            expect(service.validateAddress('G' + '!'.repeat(55))).toBe(false)
        })
    })

    describe('generateReceiveAddress', () => {
        it('should return the mock stellar public key', () => {
            expect(service.generateReceiveAddress()).toBe(TEST_STELLAR_ADDRESS)
        })
    })

    describe('getTransactionHistory', () => {
        it('should return persisted transactions', async () => {
            const history = await service.getTransactionHistory()
            expect(Array.isArray(history)).toBe(true)
        })
    })

    describe('shortenKey', () => {
        it('should shorten keys correctly', () => {
            const shortened = service.shortenKey(TEST_STELLAR_ADDRESS)
            expect(shortened).toBe('GAAAAA…AAAWHF')
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

        it('should throw error for invalid destination', async () => {
            await expect(service.sendPayment('invalid', 10, 'XLM'))
                .rejects.toThrow(StellarServiceError)
        })

        it('should throw error for non-positive amount', async () => {
            await expect(service.sendPayment(TEST_STELLAR_ADDRESS, 0, 'XLM'))
                .rejects.toThrow(WalletServiceError)
        })

        it('should throw error when payment verification fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ error: 'Verification failed' }),
            })

            await expect(service.sendPayment(TEST_STELLAR_ADDRESS, 10, 'XLM'))
                .rejects.toThrow(StellarServiceError)
        })

        it('should throw a default error when verification response is not JSON', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                json: () => Promise.reject(new Error('invalid json')),
            })

            await expect(service.sendPayment(TEST_STELLAR_ADDRESS, 10, 'XLM'))
                .rejects.toThrow('Payment verification failed')
        })
    })
})
