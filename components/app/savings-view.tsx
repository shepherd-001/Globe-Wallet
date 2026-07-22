"use client"

import { TrendingUp, Plus, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MOCK_SAVINGS_GOALS } from "@/lib/fixtures"
import { formatCurrency } from "@/lib/helpers/format"

export function SavingsView() {
  const totalSavedNgn = 320000 + 1500 * 1600 + 540 * 2000

  return (
    <div className="px-4 pt-5">
      <Card className="border-0 bg-primary p-5 text-primary-foreground shadow-xl shadow-primary/30">
        <div className="flex items-center gap-2 text-xs opacity-80">
          <Target className="h-4 w-4" /> Total saved across vaults
        </div>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(totalSavedNgn, "NGN")}</p>
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className="flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 font-medium">
            <TrendingUp className="h-3 w-3" /> Earning up to 12% APY
          </span>
        </div>
      </Card>

      <div className="mb-2 mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Your vaults</h2>
        <span className="text-xs text-muted-foreground">{MOCK_SAVINGS_GOALS.length} active</span>
      </div>

      <div className="space-y-3">
        {MOCK_SAVINGS_GOALS.map((goal) => {
          const pct = Math.round((goal.saved / goal.target) * 100)
          return (
            <Card key={goal.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full ${goal.color} text-primary-foreground`}>
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">{goal.apy}% APY</p>
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">{pct}%</span>
              </div>

              <Progress value={pct} className="mt-3 h-2" />

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{formatCurrency(goal.saved, goal.currency)}</span>
                <span className="text-muted-foreground">of {formatCurrency(goal.target, goal.currency)}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add funds
                </Button>
                <Button size="sm" variant="outline" className="h-8 bg-transparent text-xs">
                  Withdraw
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Button variant="outline" className="mt-4 w-full bg-transparent">
        <Plus className="h-4 w-4" /> Create new vault
      </Button>
    </div>
  )
}
