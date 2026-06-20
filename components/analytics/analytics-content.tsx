"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Minus, Users, CheckCircle, Clock, Target, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import type { AnalyticsStat, ChartDataPoint } from "@/lib/types"
import { buildVolumeHistory, buildCategoryBreakdown } from "@/lib/analytics/chart-data"
import { MOCK_TRANSACTIONS } from "@/lib/fixtures/transactions"

// ── Static stat definitions for task-completion metrics ──────────────────────

interface StatDefinition {
  title: string
  value: string
  subtitle?: string
  change: string
  trend: "up" | "down" | "flat"
  icon: React.ComponentType<{ className?: string }>
}

const TASK_STATS: StatDefinition[] = [
  { title: "Total Tasks Completed", value: "247",  change: "+12%", trend: "up",   icon: CheckCircle },
  { title: "Active Projects",        value: "12",   change: "+3",   trend: "up",   icon: Target      },
  { title: "Team Members",           value: "24",   change: "-2",   trend: "down", icon: Users       },
  { title: "Avg. Completion Time",   value: "2.3",  subtitle: "days", change: "-0.5", trend: "up", icon: Clock },
]

// ── Chart configurations ──────────────────────────────────────────────────────

const volumeChartConfig: ChartConfig = {
  value: { label: "Volume (USD)", color: "hsl(var(--primary))" },
}

const categoryChartConfig: ChartConfig = {
  volume: { label: "Volume",  color: "hsl(var(--primary))" },
  count:  { label: "Count",   color: "hsl(var(--chart-2))" },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up")   return <TrendingUp  className="w-3 h-3 text-green-600" />
  if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-600"  />
  return <Minus className="w-3 h-3 text-muted-foreground" />
}

function StatCard({ stat, index, hovered, onEnter, onLeave }: {
  stat: StatDefinition
  index: number
  hovered: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  const trendColor = stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-muted-foreground"
  return (
    <Card
      data-testid={`analytics-stat-${index}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ animationDelay: `${index * 100}ms` }}
      className={`bg-card text-foreground p-4 transition-all duration-500 ease-out animate-slide-in-up cursor-pointer ${
        hovered ? "scale-105 shadow-2xl" : "shadow-lg"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <stat.icon className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          <h3 className="text-xs font-medium opacity-90">{stat.title}</h3>
        </div>
        <div
          className={`w-6 h-6 rounded-full bg-primary flex items-center justify-center transition-transform duration-300 ${
            hovered ? "rotate-45" : ""
          }`}
          aria-hidden="true"
        >
          <ArrowUpRight className="w-3 h-3 text-primary-foreground" />
        </div>
      </div>
      <p className="text-3xl font-bold mb-2">
        {stat.value}
        {stat.subtitle && <span className="text-base font-normal ml-1">{stat.subtitle}</span>}
      </p>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        <TrendIcon trend={stat.trend} />
        <span className={trendColor}>{stat.change}</span>
      </div>
    </Card>
  )
}

function VolumeChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <Card className="p-6" data-testid="volume-chart">
      <h3 className="font-semibold text-lg mb-4">Transaction Volume (7 Days)</h3>
      <ChartContainer config={volumeChartConfig} className="h-52">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="text-muted/20" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-value)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  )
}

function CategoryChart({ data }: { data: { name: string; volume: number; count: number }[] }) {
  return (
    <Card className="p-6" data-testid="category-chart">
      <h3 className="font-semibold text-lg mb-4">Transactions by Category</h3>
      <ChartContainer config={categoryChartConfig} className="h-52">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="text-muted/20" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="count"  fill="var(--color-count)"  radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ChartContainer>
    </Card>
  )
}

// ── Main exported component ───────────────────────────────────────────────────

export function AnalyticsContent() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [volumeData, setVolumeData] = useState<ChartDataPoint[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; volume: number; count: number }[]>([])

  useEffect(() => {
    const volume = buildVolumeHistory(MOCK_TRANSACTIONS, 'day')
    setVolumeData(volume)

    const breakdown = buildCategoryBreakdown(MOCK_TRANSACTIONS)
    const cats = breakdown.map((b) => ({
      name: b.category,
      volume: b.volume,
      count: b.count,
    }))
    setCategoryData(cats)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in" data-testid="analytics-content">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TASK_STATS.map((stat, index) => (
          <StatCard
            key={stat.title}
            stat={stat}
            index={index}
            hovered={hoveredCard === index}
            onEnter={() => setHoveredCard(index)}
            onLeave={() => setHoveredCard(null)}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VolumeChart data={volumeData} />
        <CategoryChart data={categoryData} />
      </div>
    </div>
  )
}
