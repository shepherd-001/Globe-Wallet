/**
 * @jest-environment node
 */
import {
  filterAndSortTransactions,
  generateTransactionId,
  isoToDisplayDate,
  searchTransaction,
  getTransactionDirection,
  getTransactionDisplayName,
  calculateNetworkFee,
  formatFeeDisplay,
  STELLAR_BASE_FEE_XLM,
} from '../../../lib/transaction-utils'
import { Transaction } from '../../../lib/types'

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx1',
  type: 'receive',
  amount: 100,
  asset: 'XLM',
  address: 'GTEST123',
  date: new Date(2025, 0, 15).toISOString(),
  status: 'completed',
  category: 'deposit',
  name: 'Test Receive',
  detail: 'From wallet',
  ...overrides,
})

describe('searchTransaction', () => {
  it('returns true for empty query', () => {
    expect(searchTransaction(makeTx(), '')).toBe(true)
  })

  it('matches on name (case-insensitive)', () => {
    expect(searchTransaction(makeTx({ name: 'Payroll XLM' }), 'payroll')).toBe(true)
  })

  it('matches on address', () => {
    expect(searchTransaction(makeTx({ address: 'GABC123' }), 'GABC123')).toBe(true)
  })

  it('matches on stellarHash', () => {
    expect(searchTransaction(makeTx({ stellarHash: '0xabc123' }), '0xabc')).toBe(true)
  })

  it('returns false when no match', () => {
    expect(searchTransaction(makeTx({ name: 'Alpha', detail: 'Beta', address: 'GXXX' }), 'zzzz')).toBe(false)
  })
})

describe('filterAndSortTransactions', () => {
  const txs: Transaction[] = [
    makeTx({ id: 'a', type: 'receive', asset: 'XLM', status: 'completed', category: 'deposit',
      date: new Date(2025, 0, 10).toISOString(), amount: 50 }),
    makeTx({ id: 'b', type: 'send', asset: 'USDC', status: 'pending', category: 'payment',
      date: new Date(2025, 0, 20).toISOString(), amount: 200, name: 'USDC Send' }),
    makeTx({ id: 'c', type: 'withdraw', asset: 'XLM', status: 'failed', category: 'withdrawal',
      date: new Date(2025, 0, 5).toISOString(), amount: 10 }),
  ]

  it('returns all transactions when no filters applied', () => {
    expect(filterAndSortTransactions(txs, {})).toHaveLength(3)
  })

  it('filters by type (in / out)', () => {
    const inTxs = filterAndSortTransactions(txs, { type: 'in' })
    expect(inTxs.every(t => t.type === 'receive')).toBe(true)

    const outTxs = filterAndSortTransactions(txs, { type: 'out' })
    expect(outTxs.every(t => t.type === 'send' || t.type === 'withdraw')).toBe(true)
  })

  it('filters by asset', () => {
    const result = filterAndSortTransactions(txs, { asset: 'USDC' })
    expect(result.every(t => t.asset === 'USDC')).toBe(true)
  })

  it('filters by status', () => {
    const result = filterAndSortTransactions(txs, { status: 'pending' })
    expect(result.every(t => t.status === 'pending')).toBe(true)
  })

  it('filters by category', () => {
    const result = filterAndSortTransactions(txs, { category: 'withdrawal' })
    expect(result.every(t => t.category === 'withdrawal')).toBe(true)
  })

  it('filters by search', () => {
    const result = filterAndSortTransactions(txs, { search: 'USDC Send' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b')
  })

  it('sorts by amount asc', () => {
    const result = filterAndSortTransactions(txs, { sortBy: 'amount', sortOrder: 'asc' })
    expect(result[0].amount).toBeLessThanOrEqual(result[1].amount)
  })

  it('sorts by amount desc', () => {
    const result = filterAndSortTransactions(txs, { sortBy: 'amount', sortOrder: 'desc' })
    expect(result[0].amount).toBeGreaterThanOrEqual(result[1].amount)
  })

  it('sorts by asset alphabetically asc', () => {
    const result = filterAndSortTransactions(txs, { sortBy: 'asset', sortOrder: 'asc' })
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].asset <= result[i + 1].asset).toBe(true)
    }
  })

  it('defaults to date desc (newest first)', () => {
    const result = filterAndSortTransactions(txs, {})
    expect(new Date(result[0].date).getTime()).toBeGreaterThanOrEqual(new Date(result[1].date).getTime())
  })

  it('does not mutate input array', () => {
    const input = [...txs]
    filterAndSortTransactions(txs, { sortBy: 'amount', sortOrder: 'asc' })
    expect(txs.map(t => t.id)).toEqual(input.map(t => t.id))
  })
})

describe('generateTransactionId', () => {
  it('returns a unique non-empty string each call', () => {
    const a = generateTransactionId()
    const b = generateTransactionId()
    expect(typeof a).toBe('string')
    expect(a.length).toBeGreaterThan(0)
    expect(a).not.toBe(b)
  })

  it('starts with tx_', () => {
    expect(generateTransactionId().startsWith('tx_')).toBe(true)
  })
})

describe('isoToDisplayDate', () => {
  it('returns "Today, HH:mm" for a date within the last 24 hours', () => {
    const now = new Date().toISOString()
    expect(isoToDisplayDate(now)).toMatch(/^Today,/)
  })

  it('returns the original string for non-ISO input', () => {
    expect(isoToDisplayDate('Yesterday, 14:30')).toBe('Yesterday, 14:30')
  })
})

describe('getTransactionDirection', () => {
  it('maps receive to in', () => expect(getTransactionDirection(makeTx({ type: 'receive' }))).toBe('in'))
  it('maps send to out', () => expect(getTransactionDirection(makeTx({ type: 'send' }))).toBe('out'))
  it('maps withdraw to out', () => expect(getTransactionDirection(makeTx({ type: 'withdraw' }))).toBe('out'))
  it('maps convert to in (default)', () => expect(getTransactionDirection(makeTx({ type: 'convert' }))).toBe('in'))
})

describe('getTransactionDisplayName', () => {
  it('uses tx.name if present', () => expect(getTransactionDisplayName(makeTx({ name: 'Custom' }))).toBe('Custom'))
  it('falls back to "Received payment" for receive', () => {
    expect(getTransactionDisplayName(makeTx({ name: undefined, type: 'receive' }))).toBe('Received payment')
  })
})

describe('calculateNetworkFee', () => {
  it('returns STELLAR_BASE_FEE_XLM for a valid positive amount', () => {
    expect(calculateNetworkFee(100)).toBe(STELLAR_BASE_FEE_XLM)
  })

  it('returns 0 for invalid amount', () => {
    expect(calculateNetworkFee(-1)).toBe(0)
    expect(calculateNetworkFee(0)).toBe(0)
  })
})

describe('formatFeeDisplay', () => {
  it('formats with 5 decimal places and asset code', () => {
    expect(formatFeeDisplay(0.00001, 'XLM')).toBe('0.00001 XLM')
  })
})
