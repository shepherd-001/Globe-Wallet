"use client"

import { Send, QrCode, ArrowLeftRight, Banknote } from "lucide-react"
import Link from "next/link"

const actions = [
  { label: "Send", icon: Send, href: "/send" },
  { label: "Receive", icon: QrCode, href: "/receive" },
  { label: "Convert", icon: ArrowLeftRight, href: "/convert" },
  { label: "Cash Out", icon: Banknote, href: "/off-ramp" },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 px-4 pt-5" data-testid="quick-actions">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          data-testid={`quick-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
          className="flex flex-col items-center gap-2 rounded-2xl bg-card p-3 text-center shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
            <action.icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-medium text-foreground">{action.label}</span>
        </Link>
      ))}
    </div>
  )
}
