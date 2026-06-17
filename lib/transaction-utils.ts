import { AssetCode, CurrencyCode, Transaction, TransactionCategory, TransactionDirection } from './types'

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
