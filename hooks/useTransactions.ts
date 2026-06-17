import { useState, useCallback } from 'react'
import { useFinanceServices } from './useFinanceServices'
import { useErrorBoundary } from './useErrorBoundary'
import {
  Transaction,
  CurrencyCode,
  TransactionCategory,
  TransactionDirection,
} from '../lib/types'
import {
  getTransactionCurrency,
  matchesCategoryFilter,
  matchesDirectionFilter,
} from '../lib/transaction-utils'

interface TransactionFilters {
  type?: TransactionDirection
  category?: TransactionCategory
  currency?: CurrencyCode
  dateRange?: { start: Date; end: Date }
}

export function useTransactions() {
  const { fiat, wallet } = useFinanceServices()
  const { hasError, error } = useErrorBoundary()

  const [loading, setLoading] = useState(false)

  const getTransactions = useCallback(async (filters?: TransactionFilters): Promise<Transaction[]> => {
    setLoading(true)

    try {
      let filtered = await wallet.getTransactionHistory()

      if (filters?.type) {
        filtered = filtered.filter((t) => matchesDirectionFilter(t, filters.type))
      }
      if (filters?.category) {
        filtered = filtered.filter((t) => matchesCategoryFilter(t, filters.category))
      }
      if (filters?.currency) {
        filtered = filtered.filter((t) => getTransactionCurrency(t) === filters.currency)
      }

      setLoading(false)
      return filtered
    } catch (err) {
      setLoading(false)
      throw err
    }
  }, [wallet])

  const formatTransactionAmount = useCallback((transaction: Transaction): string => {
    const currency = getTransactionCurrency(transaction)
    try {
      return fiat.formatMoney(transaction.amount, currency)
    } catch {
      return `${transaction.amount} ${currency}`
    }
  }, [fiat])

  const convertTransactionAmount = useCallback((
    transaction: Transaction,
    targetCurrency: CurrencyCode,
  ): number => {
    const sourceCurrency = getTransactionCurrency(transaction)
    try {
      return fiat.convertCurrency(sourceCurrency, targetCurrency, transaction.amount)
    } catch {
      return 0
    }
  }, [fiat])

  const getTransactionsByCategory = useCallback(async (category: TransactionCategory) => {
    return getTransactions({ category })
  }, [getTransactions])

  const getTransactionsByType = useCallback(async (type: TransactionDirection) => {
    return getTransactions({ type })
  }, [getTransactions])

  const calculateCategoryTotal = useCallback(async (
    category: TransactionCategory,
    targetCurrency: CurrencyCode = 'USD',
  ): Promise<number> => {
    const categoryTransactions = await getTransactionsByCategory(category)

    return categoryTransactions.reduce((total: number, transaction: Transaction) => {
      const converted = convertTransactionAmount(transaction, targetCurrency)
      const direction = transaction.type === 'receive' ? 'in' : 'out'
      return total + (direction === 'out' ? -converted : converted)
    }, 0)
  }, [getTransactionsByCategory, convertTransactionAmount])

  return {
    loading,
    hasError,
    error,
    getTransactions,
    formatTransactionAmount,
    convertTransactionAmount,
    getTransactionsByCategory,
    getTransactionsByType,
    calculateCategoryTotal,
  }
}
