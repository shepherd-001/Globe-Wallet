import { PricingService } from '../../../lib/services/pricing.service'
import { StellarServiceError } from '../../../lib/types'

describe('PricingService', () => {
    let service: PricingService

    beforeEach(() => {
        service = new PricingService()
    })

    describe('getAssets', () => {
        it('should return a list of crypto assets', () => {
            const assets = service.getAssets()
            expect(assets).toHaveLength(3)
            expect(assets[0].code).toBe('XLM')
        })
    })

    describe('getPrice', () => {
        it('should return the price for a valid asset code', async () => {
            const price = await service.getPrice('XLM')
            expect(price).toBe(0.1185)
        })

        it('should throw for an unknown asset code', async () => {
            await expect(service.getPrice('UNKNOWN' as any)).rejects.toThrow(StellarServiceError)
        })
    })

    describe('formatAsset', () => {
        it('should format XLM correctly', () => {
            const formatted = service.formatAsset(100, 'XLM')
            expect(formatted).toBe('100.00 XLM')
        })

        it('should mask balance when hidden is true', () => {
            const formatted = service.formatAsset(100, 'XLM', true)
            expect(formatted).toBe('•••• XLM')
        })
    })
})
