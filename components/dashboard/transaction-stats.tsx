'use client'

import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionSyncStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TransactionStatsProps {
  total: number
  syncStatus: TransactionSyncStatus | null
  onSync?: () => void
  syncing?: boolean
  className?: string
}

function formatLastSync(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'Never synced'
  const d = new Date(lastSyncAt)
  if (isNaN(d.getTime())) return 'Unknown'
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  return `${Math.floor(diffSec / 3600)}h ago`
}

export function TransactionStats({ total, syncStatus, onSync, syncing, className }: TransactionStatsProps) {
  return (
    <div
      data-testid="transaction-stats"
      className={cn('flex items-center justify-between rounded-xl border border-border bg-card p-3', className)}
    >
      <div>
        <p className="text-xs text-muted-foreground">Transactions</p>
        <p data-testid="transaction-stats-total" className="text-lg font-bold text-foreground">
          {total}
        </p>
        <p
          data-testid="transaction-stats-sync"
          className="mt-0.5 text-[10px] text-muted-foreground"
        >
          Last sync: {formatLastSync(syncStatus?.lastSyncAt ?? null)}
          {syncStatus?.pendingCount ? ` · ${syncStatus.pendingCount} pending` : ''}
        </p>
      </div>
      {onSync && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sync transactions"
          data-testid="sync-button"
          onClick={onSync}
          disabled={syncing}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
