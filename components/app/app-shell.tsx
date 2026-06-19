import type { ReactNode } from "react"
import { A11Y_MAIN_CONTENT_ID } from "@/lib/a11y/pages"
import { SkipLink } from "@/components/ui/skip-link"
import { BottomNav } from "./bottom-nav"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-secondary">
      <SkipLink />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-xl">
        <main id={A11Y_MAIN_CONTENT_ID} className="flex-1 pb-24" tabIndex={-1}>
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
