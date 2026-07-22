"use client"
import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import type { ChartConfig, ChartTooltipRenderProps } from "@/lib/types"

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

export default function ProjectAnalyticsChart({ chartData }: { chartData: any[] }) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  return (
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
  )
}
