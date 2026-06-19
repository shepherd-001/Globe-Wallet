"use client"

import { Home, ArrowLeftRight, CreditCard, PiggyBank, User } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: ArrowLeftRight, label: "Send", href: "/send" },
  { icon: CreditCard, label: "Cards", href: "/cards" },
  { icon: PiggyBank, label: "Savings", href: "/savings" },
  { icon: User, label: "Profile", href: "/profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur-md"
      data-testid="bottom-nav"
      aria-label="Main navigation"
    >
      <ul className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                data-testid={`nav-${item.label.toLowerCase()}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300",
                    isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-transparent",
                  )}
                  aria-hidden="true"
                >
                  <item.icon className="h-5 w-5" />
                </span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
