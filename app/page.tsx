import { AppShell } from "@/components/app/app-shell"
import { BalanceCard } from "@/components/app/balance-card"
import { QuickActions } from "@/components/app/quick-actions"
import { CryptoHoldings } from "@/components/app/crypto-holdings"
import { TransactionList } from "@/components/app/transaction-list"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { savingsGoals, formatMoney } from "@/lib/finance-data"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function HomePage() {
  return (
    <AppShell>
      <BalanceCard />
      <QuickActions />

      <section className="hidden px-4 pt-6 md:block" data-testid="dashboard-overview">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Portfolio overview</h2>
        <StatsCards />
      </section>

      <CryptoHoldings />

      <section className="px-4 pt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Savings goals</h2>
          <Link href="/savings" className="flex items-center text-xs font-medium text-primary">
            See all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {savingsGoals.map((goal) => {
            const pct = Math.round((goal.saved / goal.target) * 100)
            return (
              <Card key={goal.id} className="w-44 shrink-0 p-4">
                <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatMoney(goal.saved, goal.currency)} of {formatMoney(goal.target, goal.currency)}
                </p>
                <Progress value={pct} className="mt-3 h-1.5" />
                <p className="mt-2 text-xs font-medium text-primary">{pct}% saved</p>
              </Card>
            )
          })}
        </div>
      </section>

      <section className="px-4 pt-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <span className="text-xs font-medium text-muted-foreground">This week</span>
        </div>
        <Card className="px-4 py-1">
          <TransactionList limit={5} />
        </Card>
      </section>
    </AppShell>
  )
}
