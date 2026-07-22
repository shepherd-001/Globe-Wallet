import { IOffRampService, AssetCode, CurrencyCode, TransactionResult, OffRampMethod, OffRampServiceError } from '../types'
import { BaseService } from './base.service'
import { OFF_RAMP_RATES } from '../fixtures'

/**
 * Level 2 Architecture Sync: Off-Ramp Service
 * Implements simulated anchor withdrawal as defined in architecture.md
 */
export class OffRampService extends BaseService implements IOffRampService {
    constructor() {
        super('OffRampService')
    }

    async initiateWithdrawal(amount: number, asset: AssetCode, methodId: string, currency: CurrencyCode): Promise<TransactionResult> {
        return this.withPerformanceTracking('initiateWithdrawal', async () => {
            try {
                if (amount <= 0) {
                    throw new OffRampServiceError("Amount must be greater than zero")
                }
                // Simulate off-ramp anchor interaction (SEP-24/SEP-6)
                await new Promise(r => setTimeout(r, 1500))

                return {
                    success: true,
                    hash: 'offramp_' + Math.random().toString(16).slice(2),
                    status: 'pending'
                }
            } catch (err) {
                this.handleError(err, 'initiateWithdrawal')
            }
        })
    }

    async getRates(): Promise<Record<string, number>> {
        return { ...OFF_RAMP_RATES }
    }

    getMethods(): OffRampMethod[] {
        return [
            {
                id: 'm1',
                name: 'Bank Transfer (NGN)',
                description: 'Withdraw to any Nigerian bank account',
                currency: 'NGN',
                minAmount: 1000,
                maxAmount: 5000000,
                processingTime: 'Instant - 1 hour',
                fee: 100
            },
            {
                id: 'm2',
                name: 'SEPA Transfer (EUR)',
                description: 'Withdraw to European bank account',
                currency: 'EUR',
                minAmount: 10,
                maxAmount: 50000,
                processingTime: '1 - 2 business days',
                fee: 1.5
            },
            {
                id: 'm3',
                name: 'ACH Transfer (USD)',
                description: 'Withdraw to US bank account',
                currency: 'USD',
                minAmount: 20,
                maxAmount: 100000,
                processingTime: '2 - 3 business days',
                fee: 2.0
            }
        ]
    }
}
