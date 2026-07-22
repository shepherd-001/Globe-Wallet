import { AssetCode, CurrencyCode, Transaction, TransactionCategory, TransactionDirection, TransactionSortField, TransactionSortOrder } from './types'

/** Stellar network base fee in XLM (testnet/mainnet use the same order of magnitude). */
export const STELLAR_BASE_FEE_XLM = 0.00001

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

const DEFAULT_CATEGORY: TransactionCategory = 'transfer'

/** Maps service transaction types to UI direction (income vs expense). */
export function getTransactionDirection(tx: Transaction): TransactionDirection {
  if (tx.type === 'receive') return 'in'
  if (tx.type === 'send' || tx.type === 'withdraw') return 'out'
  return 'in'
}

export function getTransactionCategory(tx: Transaction): TransactionCategory {
  return tx.category ?? DEFAULT_CATEGORY
}

export function getTransactionDisplayName(tx: Transaction): string {
  if (tx.name) return tx.name
  if (tx.type === 'receive') return 'Received payment'
  if (tx.type === 'send') return 'Sent payment'
  if (tx.type === 'convert') return 'Currency conversion'
  return 'Withdrawal'
}

export function getTransactionDetail(tx: Transaction): string {
  if (tx.detail) return tx.detail
  return tx.address
}

export function getTransactionCurrency(tx: Transaction): CurrencyCode {
  if (tx.currency) return tx.currency
  if (tx.asset === 'XLM' || tx.asset === 'USDC' || tx.asset === 'USDT') return 'USD'
  return 'USD'
}

export function calculateNetworkFee(amount: number, _asset: AssetCode = 'XLM'): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return STELLAR_BASE_FEE_XLM
}

export function formatFeeDisplay(fee: number, asset: AssetCode = 'XLM'): string {
  return `${fee.toFixed(5)} ${asset}`
}

export function matchesDirectionFilter(tx: Transaction, direction?: TransactionDirection): boolean {
  if (!direction) return true
  return getTransactionDirection(tx) === direction
}

export function matchesCategoryFilter(tx: Transaction, category?: TransactionCategory): boolean {
  if (!category) return true
  return getTransactionCategory(tx) === category
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_SYMBOLS[currency] ?? currency
}

export function enrichTransaction(tx: Transaction): Transaction & {
  direction: TransactionDirection
  displayName: string
  displayDetail: string
  displayCurrency: CurrencyCode
} {
  return {
    ...tx,
    direction: getTransactionDirection(tx),
    displayName: getTransactionDisplayName(tx),
    displayDetail: getTransactionDetail(tx),
    displayCurrency: getTransactionCurrency(tx),
  }
}

export function searchTransaction(tx: Transaction, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    (tx.name ?? '').toLowerCase().includes(q) ||
    (tx.detail ?? '').toLowerCase().includes(q) ||
    tx.address.toLowerCase().includes(q) ||
    tx.asset.toLowerCase().includes(q) ||
    (tx.stellarHash ?? '').toLowerCase().includes(q)
  )
}

export interface SortableFilters {
  type?: TransactionDirection
  category?: TransactionCategory
  asset?: AssetCode
  status?: Transaction['status']
  from?: string
  to?: string
  search?: string
  sortBy?: TransactionSortField
  sortOrder?: TransactionSortOrder
}

export function filterAndSortTransactions(txs: Transaction[], filters: SortableFilters): Transaction[] {
  let result = txs

  if (filters.type) {
    result = result.filter(tx => matchesDirectionFilter(tx, filters.type))
  }
  if (filters.category) {
    result = result.filter(tx => matchesCategoryFilter(tx, filters.category))
  }
  if (filters.asset) {
    result = result.filter(tx => tx.asset === filters.asset)
  }
  if (filters.status) {
    result = result.filter(tx => tx.status === filters.status)
  }
  if (filters.search) {
    result = result.filter(tx => searchTransaction(tx, filters.search!))
  }
  if (filters.from) {
    const from = new Date(filters.from).getTime()
    result = result.filter(tx => {
      const d = new Date(tx.date).getTime()
      return !isNaN(d) && d >= from
    })
  }
  if (filters.to) {
    const to = new Date(filters.to).getTime()
    result = result.filter(tx => {
      const d = new Date(tx.date).getTime()
      return !isNaN(d) && d <= to
    })
  }

  const sortBy: TransactionSortField = filters.sortBy ?? 'date'
  const sortOrder: TransactionSortOrder = filters.sortOrder ?? 'desc'
  result = [...result].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'amount') {
      cmp = a.amount - b.amount
    } else if (sortBy === 'asset') {
      cmp = a.asset.localeCompare(b.asset)
    } else {
      const da = new Date(a.date).getTime()
      const db2 = new Date(b.date).getTime()
      cmp = (isNaN(da) ? 0 : da) - (isNaN(db2) ? 0 : db2)
    }
    return sortOrder === 'asc' ? cmp : -cmp
  })

  return result
}

export function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

export function isoToDisplayDate(iso: string): string {
  const now = new Date()
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (diffDays === 0) return `Today, ${timeStr}`
  if (diffDays === 1) return `Yesterday, ${timeStr}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${timeStr}`
}
