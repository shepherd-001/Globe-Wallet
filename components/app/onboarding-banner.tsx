'use client'

import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { DeveloperProfile } from '@/lib/types'

interface OnboardingBannerProps {
  profile?: DeveloperProfile
  docsUrl?: string
  onDismiss?: () => void
}

/**
 * Dismissible onboarding hint banner for new contributors.
 * Renders nothing once dismissed (persists via sessionStorage).
 */
export function OnboardingBanner({
  profile,
  docsUrl = '/docs/issue-29',
  onDismiss,
}: OnboardingBannerProps) {
  const storageKey = 'onboarding-banner-dismissed'
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    return sessionStorage.getItem(storageKey) !== 'true'
  })

  if (!visible) return null

  const handleDismiss = () => {
    sessionStorage.setItem(storageKey, 'true')
    setVisible(false)
    onDismiss?.()
  }

  const greeting = profile?.handle ? `Hey @${profile.handle}!` : 'Welcome to Globe Wallet!'

  return (
    <Card
      role="banner"
      aria-label="Developer onboarding hint"
      data-testid="onboarding-banner"
      className="mx-4 mt-4 flex items-start gap-3 border-primary/30 bg-primary/5 p-4"
    >
      <BookOpen
        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        aria-hidden
      />
      <div className="flex-1 space-y-1">
        <p
          data-testid="onboarding-greeting"
          className="text-sm font-semibold text-foreground"
        >
          {greeting}
        </p>
        <p className="text-xs text-muted-foreground">
          New to the codebase? Read the{' '}
          <a
            href={docsUrl}
            data-testid="onboarding-docs-link"
            className="font-medium text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            developer onboarding guide
          </a>{' '}
          to get up to speed quickly.
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        aria-label="Dismiss onboarding banner"
        data-testid="onboarding-dismiss"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </Card>
  )
}
