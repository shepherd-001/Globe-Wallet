import { IWalletService, StellarAccount, Balance, Transaction, TransactionResult, AssetCode, StellarServiceError, WalletServiceError } from '../types'
import { stellarAccount, cryptoAssets, shortenKey } from '../finance-data'
import { BaseService } from './base.service'
import { db } from '../db/mock-db'
import { injectTraceHeaders } from '../tracing/tracer'

/**
 * Level 2 Architecture Sync: Wallet Service
 * Implements simulated Stellar account operations with persistence.
 */
export class WalletService extends BaseService implements IWalletService {
    constructor() {
        super('WalletService')
    }

    getAccountInfo(): StellarAccount {
        return {
            publicKey: stellarAccount.publicKey,
            name: 'Primary Wallet',
            network: stellarAccount.network || 'Stellar Public Network',
            isFunded: true
        }
    }

    async getBalance(): Promise<Balance[]> {
        return this.withPerformanceTracking('getBalance', async () => {
            return cryptoAssets.map(asset => ({
                asset: asset.code as AssetCode,
                amount: asset.balance,
                priceUsd: asset.priceUsd
            }))
        })
    }

    async sendPayment(destination: string, amount: number, asset: AssetCode, memo?: string): Promise<TransactionResult> {
        return this.withPerformanceTracking('sendPayment', async () => {
            try {
                if (amount <= 0) {
                    throw new WalletServiceError("Amount must be greater than zero")
                }

                if (!this.validateAddress(destination)) {
                    throw new StellarServiceError("Invalid destination address")
                }

                // Call mock API for transaction verification/simulation
                // Using absolute URL when in non-browser context if needed, but relative works with mock/fetch
                // Issue #103: propagate the active span's trace context (traceparent/tracestate)
                // so /api/wallet/send can continue this trace instead of starting a new one.
                const headers = injectTraceHeaders({ 'Content-Type': 'application/json' })
                const response = await fetch('/api/wallet/send', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ destination, amount, asset, memo })
                })

                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}))
                    throw new StellarServiceError(errBody.error || "Payment verification failed")
                }

                const result = await response.json() as TransactionResult

                // Persistence (Level 2 Sync)
                await db.saveTransaction({
                    id: Math.floor(Math.random() * 1000000).toString(),
                    type: 'send',
                    amount,
                    asset,
                    address: destination,
                    date: 'Just now',
                    status: 'completed',
                    stellarHash: result.hash
                })

                return result
            } catch (err) {
                this.handleError(err, 'sendPayment')
            }
        })
    }

    generateReceiveAddress(): string {
        return stellarAccount.publicKey
    }

    validateAddress(address: string): boolean {
        if (!address || typeof address !== 'string') return false
        if (address.length !== 56) return false
        if (!address.startsWith('G')) return false

        const stellarRegex = /^G[A-Z0-9]{55}$/i
        return stellarRegex.test(address)
    }

    async getTransactionHistory(): Promise<Transaction[]> {
        return db.getTransactions()
    }

    shortenKey(key: string, lead = 6, tail = 6): string {
        return shortenKey(key, lead, tail)
    }
}
