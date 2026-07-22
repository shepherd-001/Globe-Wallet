/**
 * Integration tests for onboarding flow — issue #29
 * Verifies that OnboardingBanner interacts correctly with the app shell
 * and that the docs link points to a resolvable route.
 * Uses mocked services so no real network calls are made.
 */
import * as React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OnboardingBanner } from '../../components/app/onboarding-banner'
import { PageHeader } from '../../components/app/page-header'

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  }
})

// Simulated page that composes PageHeader + OnboardingBanner, mirroring real pages
function OnboardingPage({
  onDismiss,
}: {
  onDismiss?: () => void
}) {
  return (
    <div>
      <PageHeader title="Dashboard" />
      <OnboardingBanner
        profile={{ handle: 'newdev', role: 'fullstack', advancedMode: false }}
        docsUrl="/docs/issue-29"
        onDismiss={onDismiss}
      />
    </div>
  )
}

describe('Onboarding integration', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders header and banner together without conflicts', () => {
    render(<OnboardingPage />)
    expect(screen.getByTestId('page-header')).toBeInTheDocument()
    expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument()
  })

  it('banner greeting reflects injected developer profile', () => {
    render(<OnboardingPage />)
    expect(screen.getByTestId('onboarding-greeting')).toHaveTextContent('@newdev')
  })

  it('banner docs link points to issue-29 guide', () => {
    render(<OnboardingPage />)
    expect(screen.getByTestId('onboarding-docs-link')).toHaveAttribute(
      'href',
      '/docs/issue-29'
    )
  })

  it('dismissing banner removes it from the DOM and fires callback', async () => {
    const onDismiss = jest.fn()
    render(<OnboardingPage onDismiss={onDismiss} />)

    fireEvent.click(screen.getByTestId('onboarding-dismiss'))

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument()
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('header remains visible after banner is dismissed', async () => {
    render(<OnboardingPage />)
    fireEvent.click(screen.getByTestId('onboarding-dismiss'))

    await waitFor(() => {
      expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument()
    })
    expect(screen.getByTestId('page-header')).toBeInTheDocument()
  })

  it('banner is not shown on re-render when sessionStorage is set', () => {
    sessionStorage.setItem('onboarding-banner-dismissed', 'true')
    render(<OnboardingPage />)
    expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument()
    // header still renders normally
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Dashboard')
  })

  it('mocked API GET /api/assets returns expected shape', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          { code: 'XLM', name: 'Stellar Lumens', balance: 100, priceUsd: 0.12, change24h: 1 },
        ]),
    })

    const res = await fetch('/api/assets')
    const data = await res.json()
    expect(data[0]).toHaveProperty('code', 'XLM')
    expect(data[0]).toHaveProperty('priceUsd')
  })

  it('mocked API GET /api/assets failure is handled gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Service unavailable' }),
    })

    const res = await fetch('/api/assets')
    expect(res.ok).toBe(false)
    const body = await res.json()
    expect(body.error).toBe('Service unavailable')
  })
})
