'use client'

import { useState, useEffect } from 'react'
import type { AppShellConfig } from '@/lib/types'

interface UseShellState {
  config: AppShellConfig | null
  loading: boolean
  error: string | null
}

export function useShell(): UseShellState {
  const [state, setState] = useState<UseShellState>({
    config: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/shell')
      .then((res) => {
        if (!res.ok) throw new Error(`Shell config fetch failed (${res.status})`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) {
          if (json.success && json.config) {
            setState({ config: json.config as AppShellConfig, loading: false, error: null })
          } else {
            setState({ config: null, loading: false, error: json.error ?? 'Unknown error' })
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load shell config'
          setState({ config: null, loading: false, error: message })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
