"use client"

import { useState } from "react"
import { Snowflake, Eye, EyeOff, Settings2, Plus, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MOCK_PAYMENT_CARDS } from "@/lib/fixtures"
import { formatCurrency } from "@/lib/helpers/format"
import { cn } from "@/lib/utils"

export function CardsView() {
  const [cards, setCards] = useState(MOCK_PAYMENT_CARDS)
  const [showNumber, setShowNumber] = useState(false)

  function toggleFreeze(id: string) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, frozen: !c.frozen } : c)))
  }

  return (
    <div className="px-4 pt-5">
      <div className="space-y-5">
        {cards.map((card) => (
          <div key={card.id}>
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-primary-foreground shadow-xl transition-all duration-500",
                card.gradient,
                card.frozen && "opacity-60 grayscale",
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs opacity-80">{card.label}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-70">{card.type} card</p>
                </div>
                <Wifi className="h-5 w-5 rotate-90 opacity-80" />
              </div>

              <p className="mt-6 font-mono text-lg tracking-widest">
                {showNumber ? `5${card.last4}  8842  1990  ${card.last4}` : `••••  ••••  ••••  ${card.last4}`}
              </p>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] opacity-70">Balance</p>
                  <p className="text-lg font-bold">{formatCurrency(card.balance, card.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-70">Expires {card.expiry}</p>
                  <p className="text-sm font-semibold">{card.brand}</p>
                </div>
              </div>

              {card.frozen && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-background/30 px-2 py-1 text-[10px] font-semibold">
                  <Snowflake className="h-3 w-3" /> Frozen
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <CardAction
                label={card.frozen ? "Unfreeze" : "Freeze"}
                icon={Snowflake}
                active={card.frozen}
                onClick={() => toggleFreeze(card.id)}
              />
              <CardAction
                label={showNumber ? "Hide" : "Details"}
                icon={showNumber ? EyeOff : Eye}
                onClick={() => setShowNumber((v) => !v)}
              />
              <CardAction label="Settings" icon={Settings2} />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-5 w-full bg-transparent">
        <Plus className="h-4 w-4" /> Create new virtual card
      </Button>

      <h2 className="mb-1 mt-7 text-sm font-semibold text-foreground">Card spending</h2>
      <Card className="p-4">
        <div className="flex items-end justify-between gap-2">
          {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-md bg-primary/80 animate-slide-in-up"
                style={{ height: `${h}px`, animationDelay: `${i * 60}ms` }}
              />
              <span className="text-[10px] text-muted-foreground">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CardAction({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ElementType
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl border border-border p-3 text-xs font-medium transition-all hover:bg-secondary",
        active ? "bg-primary/10 text-primary" : "bg-card text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
