"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cryptoAssets, formatCrypto, type AssetCode } from "@/lib/finance-data"
import { cn } from "@/lib/utils"

const assetGlyph: Record<AssetCode, string> = {
  XLM: "✦",
  USDC: "$",
  USDT: "₮",
}

export function CryptoHoldings() {
  const [hidden] = useState(false)

  return (
    <section className="px-4 pt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Crypto on Stellar</h2>
        <Link href="/convert" className="flex items-center text-xs font-medium text-primary">
          Convert <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <Card className="divide-y divide-border p-0">
        {cryptoAssets.map((asset) => {
          const usdValue = asset.balance * asset.priceUsd
          const up = (asset.changePct ?? asset.change24h) >= 0
          return (
            <div key={asset.code} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-base font-bold text-background",
                  asset.color,
                )}
                aria-hidden
              >
                {assetGlyph[asset.code]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{asset.code}</p>
                <p className="truncate text-xs text-muted-foreground">{asset.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatCrypto(asset.balance, asset.code, hidden)}</p>
                <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  <span className={cn("flex items-center", up ? "text-primary" : "text-destructive")}>
                    {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(asset.changePct ?? asset.change24h)}%
                  </span>
                </p>
              </div>
            </div>
          )
        })}
      </Card>
    </section>
  )
}
