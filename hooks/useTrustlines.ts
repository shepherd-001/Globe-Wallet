import { useState, useEffect, useCallback } from 'react'
import { useFinanceServices } from './useFinanceServices'
import { Trustline, AssetCode, TrustlineResult } from '../lib/types'
import { useToast } from './use-toast'

export const RESERVE_PER_TRUSTLINE = 0.5;

export function useTrustlines() {
  const [trustlines, setTrustlines] = useState<Trustline[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const { wallet } = useFinanceServices()

  const fetchTrustlines = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/wallet/trustlines')
      if (!res.ok) {
        throw new Error('Failed to fetch trustlines')
      }
      const data = await res.json()
      setTrustlines(data)
    } catch (error: any) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error fetching trustlines",
        description: error.message
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTrustlines()
  }, [fetchTrustlines])

  const changeTrustline = useCallback(async (asset: AssetCode, action: 'add' | 'remove'): Promise<TrustlineResult | null> => {
    try {
      setIsProcessing(true)
      const res = await fetch('/api/wallet/trustlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset, action })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change trustline')
      }

      toast({
        title: action === 'add' ? "Trustline added" : "Trustline removed",
        description: `Successfully ${action === 'add' ? 'added' : 'removed'} trustline for ${asset}.`
      })

      await fetchTrustlines()
      return data.data
    } catch (error: any) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Trustline operation failed",
        description: error.message
      })
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [fetchTrustlines, toast])

  const hasTrustline = useCallback((asset: AssetCode) => {
    return trustlines.some(t => t.asset === asset)
  }, [trustlines])

  return {
    trustlines,
    loading,
    isProcessing,
    changeTrustline,
    hasTrustline,
    refreshTrustlines: fetchTrustlines
  }
}
