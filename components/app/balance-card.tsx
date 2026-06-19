"use client"

import { useState, useEffect } from "react"
import { Bell, Eye, EyeOff, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { useBalances } from "@/hooks/useBalances"
import { useWallets } from "@/hooks/useFinanceServices"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { CurrencyCode } from "@/lib/types"

export function BalanceCard() {
  const [hidden, setHidden] = useState(false)
  const { wallets, loading } = useBalances()
  const { formatMoney } = useWallets()
  const [active, setActive] = useState<CurrencyCode>("NGN")

  const wallet = wallets.find((w) => w.code === active)

  return (
    <div className="px-4 pt-4" data-testid="balance-card">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src="/professional-avatar.jpg" alt="Your profile" />
            <AvatarFallback className="bg-primary text-primary-foreground">TA</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-sm font-semibold text-foreground">Tunde Adeyemi</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </button>
        </div>
      </header>

      <Card className="overflow-hidden border-0 bg-primary p-5 text-primary-foreground shadow-xl shadow-primary/30">
        {loading ? (
          <div className="space-y-4" data-testid="balance-card-loading">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
              <Skeleton className="h-6 w-6 bg-primary-foreground/20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
            <Skeleton className="h-10 w-48 bg-primary-foreground/20" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20 bg-primary-foreground/20" />
              <Skeleton className="h-8 w-24 bg-primary-foreground/20" />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-1.5 rounded-full bg-primary-foreground/15 p-1">
                {wallets.map((w) => (
                  <button
                    key={w.code}
                    type="button"
                    onClick={() => setActive(w.code)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                      active === w.code ? "bg-primary-foreground text-primary" : "text-primary-foreground",
                    )}
                    data-testid={`balance-switch-${w.code}`}
                  >
                    {w.code}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setHidden((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/15"
                aria-label={hidden ? "Show balance" : "Hide balance"}
                data-testid="toggle-balance-visibility"
              >
                {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>

            {wallet ? (
              <>
                <p className="text-xs text-primary-foreground/80">{wallet.label || `${wallet.code} Wallet`} balance</p>
                <p className="mt-1 text-4xl font-bold tracking-tight text-balance" data-testid="total-value">
                  {formatMoney(wallet.balance, wallet.code, hidden)}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      (wallet.changePct ?? 0) >= 0
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-destructive/20 text-primary-foreground",
                    )}
                    data-testid="balance-change"
                  >
                    {(wallet.changePct ?? 0) >= 0 ? "+" : ""}
                    {wallet.changePct ?? 0}% this week
                  </span>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-full bg-primary-foreground px-3 py-1.5 text-xs font-semibold text-primary transition-transform hover:scale-105"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Money
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm">Wallet not found</p>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
