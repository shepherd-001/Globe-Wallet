import {
  calculateNetworkFee,
  enrichTransaction,
  formatFeeDisplay,
  getCurrencySymbol,
  getTransactionCategory,
  getTransactionDetail,
  getTransactionDirection,
  getTransactionDisplayName,
  matchesCategoryFilter,
  matchesDirectionFilter,
  STELLAR_BASE_FEE_XLM,
} from '../../lib/transaction-utils'
import { Transaction } from '../../lib/types'

const sampleTx: Transaction = {
  id: 't1',
  type: 'receive',
  amount: 100,
  asset: 'XLM',
  address: 'GDXSPAY...',
  date: 'Today',
  status: 'completed',
  name: 'Alice',
  category: 'transfer',
  currency: 'USD',
}

describe('transaction-utils', () => {
  describe('getTransactionDirection', () => {
    it('maps receive to in', () => {
      expect(getTransactionDirection({ ...sampleTx, type: 'receive' })).toBe('in')
    })

    it('maps send and withdraw to out', () => {
      expect(getTransactionDirection({ ...sampleTx, type: 'send' })).toBe('out')
      expect(getTransactionDirection({ ...sampleTx, type: 'withdraw' })).toBe('out')
    })
  })

  describe('calculateNetworkFee', () => {
    it('returns zero for invalid amounts', () => {
      expect(calculateNetworkFee(0)).toBe(0)
      expect(calculateNetworkFee(-5)).toBe(0)
      expect(calculateNetworkFee(Number.NaN)).toBe(0)
    })

    it('returns base fee for positive amounts', () => {
      expect(calculateNetworkFee(10)).toBe(STELLAR_BASE_FEE_XLM)
    })

    it('formats fee display', () => {
      expect(formatFeeDisplay(STELLAR_BASE_FEE_XLM)).toBe('0.00001 XLM')
    })
  })

  describe('display helpers', () => {
    it('falls back to generated name and detail', () => {
      const tx: Transaction = {
        id: 'x',
        type: 'send',
        amount: 1,
        asset: 'USDC',
        address: 'GABC123',
        date: 'Now',
        status: 'completed',
      }
      expect(getTransactionDisplayName(tx)).toBe('Sent payment')
      expect(getTransactionDetail(tx)).toBe('GABC123')
      expect(getTransactionCategory(tx)).toBe('transfer')
    })

    it('enriches transaction with computed fields', () => {
      const enriched = enrichTransaction(sampleTx)
      expect(enriched.direction).toBe('in')
      expect(enriched.displayName).toBe('Alice')
    })
  })

  describe('filters', () => {
    it('matches direction and category filters', () => {
      expect(matchesDirectionFilter(sampleTx, 'in')).toBe(true)
      expect(matchesDirectionFilter(sampleTx, 'out')).toBe(false)
      expect(matchesCategoryFilter(sampleTx, 'transfer')).toBe(true)
      expect(matchesCategoryFilter(sampleTx, 'bills')).toBe(false)
    })
  })

  describe('getCurrencySymbol', () => {
    it('returns symbols for supported currencies', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
      expect(getCurrencySymbol('NGN')).toBe('₦')
    })
  })
})
