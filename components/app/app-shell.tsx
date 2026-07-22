import type { ReactNode } from "react"
import { A11Y_MAIN_CONTENT_ID } from "@/lib/a11y/pages"
import { SAFE_AREA_MAIN_PB } from "@/lib/a11y/safe-area"
import { SkipLink } from "@/components/ui/skip-link"
import { BottomNav } from "./bottom-nav"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary" data-testid="app-shell">
      <SkipLink />
      <div
        className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-xl"
        data-testid="app-shell-inner"
      >
        <main
          id={A11Y_MAIN_CONTENT_ID}
          className="flex-1 outline-none"
          style={{ paddingBottom: SAFE_AREA_MAIN_PB }}
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
