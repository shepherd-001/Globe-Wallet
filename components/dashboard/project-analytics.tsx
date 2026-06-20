"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { ChartDataPoint, ChartTooltipRenderProps } from "@/lib/types"

interface ProjectAnalyticsEntry extends ChartDataPoint {
  day: string
}

const chartData: ProjectAnalyticsEntry[] = [
  { day: "S", label: "Sunday",    value: 45 },
  { day: "M", label: "Monday",    value: 75 },
  { day: "T", label: "Tuesday",   value: 74 },
  { day: "W", label: "Wednesday", value: 92 },
  { day: "T", label: "Thursday",  value: 35 },
  { day: "F", label: "Friday",    value: 60 },
  { day: "S", label: "Saturday",  value: 50 },
]

const chartConfig: ChartConfig = {
  value: {
    label: "Activity",
    color: "#059669",
  },
}

function CustomTooltip({ active, payload }: ChartTooltipRenderProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="bg-foreground text-background px-3 py-2 rounded-lg text-xs font-semibold shadow-lg">
      <p className="font-bold">{entry.value}%</p>
      <p className="text-[10px] opacity-80">{entry.payload.label}</p>
    </div>
  )
}

export function ProjectAnalytics() {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const maxValue = Math.max(...chartData.map((d) => d.value))
  const average = Math.round(chartData.reduce((acc, d) => acc + d.value, 0) / chartData.length)

  return (
    <Card
      data-testid="project-analytics"
      className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up bg-linear-to-br from-background to-muted/20"
      style={{ animationDelay: "400ms" }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Project Analytics</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
          <span>Weekly Activity</span>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-64 mb-4">
        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 14 }}
            className="text-muted-foreground"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            className="text-muted-foreground"
            ticks={[0, 25, 50, 75, 100]}
          />
          <ChartTooltip
            content={<CustomTooltip />}
            cursor={{ fill: "transparent" }}
          />
          <Bar
            dataKey="value"
            fill="url(#barGradient)"
            radius={[12, 12, 12, 12]}
            maxBarSize={60}
            onMouseEnter={(_data: unknown, index: number) => setHoveredBar(index)}
            onMouseLeave={() => setHoveredBar(null)}
            style={{
              filter:
                hoveredBar !== null
                  ? "brightness(1.2) drop-shadow(0 4px 8px rgba(5, 150, 105, 0.4))"
                  : "none",
            }}
          />
        </BarChart>
      </ChartContainer>

      <div className="pt-4 border-t border-muted/50 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-muted-foreground">Average: </span>
          <span className="font-semibold text-foreground">{average}%</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">Peak: </span>
          <span className="font-semibold text-emerald-600">{maxValue}%</span>
        </div>
      </div>
    </Card>
  )
}
