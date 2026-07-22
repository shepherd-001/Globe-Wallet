"use client"

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
import { Card } from "@/components/ui/card"
import type { ChartDataPoint } from "@/lib/types"

const volumeChartConfig: ChartConfig = {
  value: { label: "Volume (USD)", color: "hsl(var(--primary))" },
}

const categoryChartConfig: ChartConfig = {
  volume: { label: "Volume",  color: "hsl(var(--primary))" },
  count:  { label: "Count",   color: "hsl(var(--chart-2))" },
}

export function VolumeChart({ data }: { data: ChartDataPoint[] }) {
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

export function CategoryChart({ data }: { data: { name: string; volume: number; count: number }[] }) {
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
