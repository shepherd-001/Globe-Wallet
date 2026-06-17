import { StellarAccount, Transaction, AssetCode } from '../types'
import { stellarAccount, transactions } from '../finance-data'

/**
 * Level 2 Architecture Sync: Persistent Storage Abstraction
 * This module simulates the persistence layer defined in architecture.md (Database Schema section).
 */

interface UserSchema {
    id: string
    email: string
    password_hash: string
    kyc_status: 'pending' | 'verified' | 'rejected'
    created_at: string
}

interface WalletAccountSchema {
    id: string
    user_id: string
    public_key: string
    encrypted_private_key: string
    account_type: 'standard' | 'premium'
    is_active: boolean
    created_at: string
}

const generateId = () => Math.random().toString(36).substr(2, 9)

class MockDB {
    private users: UserSchema[] = []
    private walletAccounts: WalletAccountSchema[] = []
    private transactions: Transaction[] = []

    constructor() {
        this.initializeDefaults()
    }

    private initializeDefaults() {
        // Mock User
        const userId = generateId()
        this.users.push({
            id: userId,
            email: 'user@globe.wallet',
            password_hash: 'argon2...hash',
            kyc_status: 'verified',
            created_at: new Date().toISOString()
        })

        // Mock Wallet Account (Synchronized with architecture.md)
        this.walletAccounts.push({
            id: generateId(),
            user_id: userId,
            public_key: stellarAccount.publicKey,
            encrypted_private_key: 'vault...key',
            account_type: 'standard',
            is_active: true,
            created_at: new Date().toISOString()
        })

        // Initial Transactions (preserve display metadata from seed data)
        this.transactions = transactions.map((tx) => ({ ...tx }))
    }

    // User Operations
    async getUser(email: string): Promise<UserSchema | undefined> {
        return this.users.find(u => u.email === email)
    }

    // Wallet Operations
    async getAccountByPublicKey(publicKey: string): Promise<WalletAccountSchema | undefined> {
        return this.walletAccounts.find(w => w.public_key === publicKey)
    }

    // Transaction Operations
    async getTransactions(): Promise<Transaction[]> {
        return this.transactions
    }

    async saveTransaction(tx: Transaction): Promise<void> {
        this.transactions.unshift(tx)
    }
}

export const db = new MockDB()
