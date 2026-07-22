'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Transaction,
  TransactionFilters,
  TransactionPage,
  TransactionSyncStatus,
} from '../lib/types'

const DEFAULT_LIMIT = 20

interface TransactionHistoryState {
  page: TransactionPage | null
  loading: boolean
  error: string | null
  syncStatus: TransactionSyncStatus | null
  syncing: boolean
  filters: TransactionFilters
}

interface UseTransactionHistoryReturn extends TransactionHistoryState {
  transactions: Transaction[]
  total: number
  hasMore: boolean
  setSearch: (query: string) => void
  setTypeFilter: (type: TransactionFilters['type']) => void
  setCategoryFilter: (category: TransactionFilters['category']) => void
  setPage: (offset: number) => void
  nextPage: () => void
  prevPage: () => void
  refresh: () => void
  sync: () => Promise<void>
  addTransaction: (body: object) => Promise<void>
}

export function useTransactionHistory(initialFilters: TransactionFilters = {}): UseTransactionHistoryReturn {
  const [state, setState] = useState<TransactionHistoryState>({
    page: null,
    loading: true,
    error: null,
    syncStatus: null,
    syncing: false,
    filters: { limit: DEFAULT_LIMIT, offset: 0, sortBy: 'date', sortOrder: 'desc', ...initialFilters },
  })

  const filtersRef = useRef(state.filters)
  filtersRef.current = state.filters

  const fetchPage = useCallback(async (filters: TransactionFilters) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const params = new URLSearchParams()
      if (filters.type) params.set('type', filters.type)
      if (filters.category) params.set('category', filters.category)
      if (filters.asset) params.set('asset', filters.asset)
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
      params.set('limit', String(filters.limit ?? DEFAULT_LIMIT))
      params.set('offset', String(filters.offset ?? 0))
      params.set('paginate', 'true')

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Failed to load transactions')

      setState(s => ({ ...s, loading: false, page: json.data, filters }))
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [])

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions/sync')
      if (res.ok) {
        const json = await res.json()
        if (json.success) setState(s => ({ ...s, syncStatus: json.data }))
      }
    } catch {
      // non-critical
    }
  }, [])

  useEffect(() => {
    fetchPage(filtersRef.current)
    fetchSyncStatus()
  }, [fetchPage, fetchSyncStatus])

  const refresh = useCallback(() => fetchPage(filtersRef.current), [fetchPage])

  const setSearch = useCallback((query: string) => {
    const next = { ...filtersRef.current, search: query || undefined, offset: 0 }
    fetchPage(next)
  }, [fetchPage])

  const setTypeFilter = useCallback((type: TransactionFilters['type']) => {
    const next = { ...filtersRef.current, type, offset: 0 }
    fetchPage(next)
  }, [fetchPage])

  const setCategoryFilter = useCallback((category: TransactionFilters['category']) => {
    const next = { ...filtersRef.current, category, offset: 0 }
    fetchPage(next)
  }, [fetchPage])

  const setPage = useCallback((offset: number) => {
    const next = { ...filtersRef.current, offset }
    fetchPage(next)
  }, [fetchPage])

  const nextPage = useCallback(() => {
    const { offset = 0, limit = DEFAULT_LIMIT } = filtersRef.current
    setPage(offset + limit)
  }, [setPage])

  const prevPage = useCallback(() => {
    const { offset = 0, limit = DEFAULT_LIMIT } = filtersRef.current
    setPage(Math.max(0, offset - limit))
  }, [setPage])

  const sync = useCallback(async () => {
    setState(s => ({ ...s, syncing: true }))
    try {
      const res = await fetch('/api/transactions/sync', { method: 'POST' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      await fetchPage(filtersRef.current)
      await fetchSyncStatus()
    } catch (err) {
      setState(s => ({
        ...s,
        error: err instanceof Error ? err.message : 'Sync failed',
      }))
    } finally {
      setState(s => ({ ...s, syncing: false }))
    }
  }, [fetchPage, fetchSyncStatus])

  const addTransaction = useCallback(async (body: object) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error ?? 'Failed to add transaction')
    await fetchPage(filtersRef.current)
  }, [fetchPage])

  return {
    ...state,
    transactions: state.page?.data ?? [],
    total: state.page?.total ?? 0,
    hasMore: state.page?.hasMore ?? false,
    setSearch,
    setTypeFilter,
    setCategoryFilter,
    setPage,
    nextPage,
    prevPage,
    refresh,
    sync,
    addTransaction,
  }
}
