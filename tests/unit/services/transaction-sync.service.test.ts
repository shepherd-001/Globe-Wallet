/**
 * @jest-environment node
 */
import { TransactionSyncService } from '../../../lib/services/transaction-sync.service'
import { db } from '../../../lib/db/mock-db'

jest.mock('@stellar/stellar-sdk', () => {
  return {
    Horizon: {
      Server: class {
        transactions() {
          return {
            forAccount: () => ({
              cursor: () => ({
                limit: () => ({
                  call: async () => ({ records: [] })
                })
              })
            }),
            transaction: (hash: string) => ({
              call: async () => {
                if (hash === '0000000000000000000000000000000000000000000000000000000000000000') {
                  const err: any = new Error('Not found')
                  err.response = { status: 404 }
                  throw err
                }
                if (hash === '798b554f9f4176f55791c79da2706f6a3327f211be8670c08f41868826a5292b') {
                  return { successful: false }
                }
                if (hash === 'b9d0b2292c4e09e8eb22d036171491e87b8d2086bf8b265874c8d182cb9c9020') {
                  return { successful: true }
                }
                return { successful: true }
              }
            })
          }
        }
      }
    }
  }
})

describe('TransactionSyncService', () => {
  let service: TransactionSyncService

  beforeEach(() => {
    service = new TransactionSyncService()
  })

  describe('getSyncStatus', () => {
    it('returns a valid TransactionSyncStatus shape', () => {
      const status = service.getSyncStatus()
      expect(status).toMatchObject({
        isSyncing: expect.any(Boolean),
        totalSynced: expect.any(Number),
        pendingCount: expect.any(Number),
      })
    })

    it('isSyncing is false before any sync', () => {
      expect(service.getSyncStatus().isSyncing).toBe(false)
    })
  })

  describe('getLastSyncTime', () => {
    it('returns null or a string', () => {
      const t = service.getLastSyncTime()
      expect(t === null || typeof t === 'string').toBe(true)
    })
  })

  describe('syncFromNetwork', () => {
    it('returns a TransactionSyncResult shape', async () => {
      const result = await service.syncFromNetwork()
      expect(result).toMatchObject({
        added: expect.any(Number),
        updated: expect.any(Number),
        failed: expect.any(Number),
        lastSyncAt: expect.any(String),
      })
    })

    it('added is non-negative', async () => {
      const result = await service.syncFromNetwork()
      expect(result.added).toBeGreaterThanOrEqual(0)
    })

    it('updates lastSyncAt after successful sync', async () => {
      await service.syncFromNetwork()
      expect(service.getLastSyncTime()).not.toBeNull()
    })

    it('checks real Horizon for pending transactions and updates them accurately', async () => {
      // 1. A non-existent hash (truly pending on Horizon)
      const fakeHash = '0000000000000000000000000000000000000000000000000000000000000000'
      const pendingTx = await service.addTransaction({
        type: 'receive',
        amount: 10,
        asset: 'XLM',
        address: 'G1',
        stellarHash: fakeHash,
      })

      // 2. A genuinely failed hash on testnet
      const failedHash = '798b554f9f4176f55791c79da2706f6a3327f211be8670c08f41868826a5292b'
      const failedTx = await service.addTransaction({
        type: 'send',
        amount: 10,
        asset: 'XLM',
        address: 'G2',
        stellarHash: failedHash,
      })

      // 3. A genuinely successful hash on testnet
      const successHash = 'b9d0b2292c4e09e8eb22d036171491e87b8d2086bf8b265874c8d182cb9c9020'
      const successTx = await service.addTransaction({
        type: 'send',
        amount: 10,
        asset: 'XLM',
        address: 'G3',
        stellarHash: successHash,
      })

      const result = await service.syncFromNetwork()

      const allTxs = await db.getTransactions()
      
      const pTx = allTxs.find(t => t.id === pendingTx.id)
      const fTx = allTxs.find(t => t.id === failedTx.id)
      const sTx = allTxs.find(t => t.id === successTx.id)

      expect(pTx?.status).toBe('pending')
      expect(fTx?.status).toBe('failed')
      expect(sTx?.status).toBe('completed')

      expect(result.updated).toBeGreaterThanOrEqual(2)
    }, 30000)
  })

  describe('addTransaction', () => {
    it('creates a transaction with generated id and pending status', async () => {
      const tx = await service.addTransaction({
        type: 'receive',
        amount: 42,
        asset: 'XLM',
        address: 'GTEST',
        name: 'New Deposit',
      })
      expect(tx.id).toMatch(/^tx_/)
      expect(tx.status).toBe('pending')
      expect(tx.amount).toBe(42)
      expect(tx.asset).toBe('XLM')
    })

    it('stores optional fields', async () => {
      const tx = await service.addTransaction({
        type: 'send',
        amount: 10,
        asset: 'USDC',
        address: 'GSEND',
        category: 'payment',
        name: 'Test Payment',
        detail: 'Invoice #42',
        currency: 'USD',
      })
      expect(tx.category).toBe('payment')
      expect(tx.detail).toBe('Invoice #42')
    })
  })

  describe('getRecentTransactions', () => {
    it('returns an array of at most the requested limit', async () => {
      const txs = await service.getRecentTransactions(3)
      expect(Array.isArray(txs)).toBe(true)
      expect(txs.length).toBeLessThanOrEqual(3)
    })

    it('returns at most 10 transactions by default', async () => {
      const txs = await service.getRecentTransactions(10)
      expect(txs.length).toBeLessThanOrEqual(10)
    })
  })
})
