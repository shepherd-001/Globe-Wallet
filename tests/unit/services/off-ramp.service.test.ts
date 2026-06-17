import { OffRampService } from '../../../lib/services/off-ramp.service'

describe('OffRampService', () => {
    let service: OffRampService

    beforeEach(() => {
        service = new OffRampService()
    })

    describe('getRates', () => {
        it('should return available off-ramp rates', async () => {
            const rates = await service.getRates()
            expect(rates).toHaveProperty('USD')
            expect(rates).toHaveProperty('NGN')
        })
    })

    describe('initiateWithdrawal', () => {
        it('should initiate a withdrawal successfully', async () => {
            const result = await service.initiateWithdrawal(50, 'XLM', 'bank-1', 'NGN')
            expect(result.status).toBe('pending')
            expect(result.success).toBe(true)
        })
    })
})
