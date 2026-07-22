/**
 * Component tests for OnboardingBanner — issue #29
 * Verifies rendering, accessibility, dismiss behaviour, and profile personalisation.
 */
import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingBanner } from '../../components/app/onboarding-banner'

// Minimal sessionStorage mock (jsdom supports it but we reset per test)
beforeEach(() => {
  sessionStorage.clear()
})

describe('OnboardingBanner — rendering', () => {
  it('renders with default welcome text when no profile provided', () => {
    render(<OnboardingBanner />)
    expect(screen.getByTestId('onboarding-banner')).toBeInTheDocument()
    expect(screen.getByTestId('onboarding-greeting')).toHaveTextContent(
      'Welcome to Globe Wallet!'
    )
  })

  it('personalises greeting when a developer profile is given', () => {
    render(
      <OnboardingBanner
        profile={{ handle: 'alice', role: 'frontend', advancedMode: false }}
      />
    )
    expect(screen.getByTestId('onboarding-greeting')).toHaveTextContent('@alice')
  })

  it('renders a link to the docs', () => {
    render(<OnboardingBanner docsUrl="https://example.com/docs" />)
    const link = screen.getByTestId('onboarding-docs-link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/docs')
  })

  it('has correct banner role for accessibility', () => {
    render(<OnboardingBanner />)
    expect(screen.getByRole('banner', { name: /developer onboarding hint/i })).toBeInTheDocument()
  })

  it('dismiss button has an accessible label', () => {
    render(<OnboardingBanner />)
    expect(
      screen.getByRole('button', { name: /dismiss onboarding banner/i })
    ).toBeInTheDocument()
  })
})

describe('OnboardingBanner — dismiss behaviour', () => {
  it('hides the banner after dismiss button click', () => {
    render(<OnboardingBanner />)
    fireEvent.click(screen.getByTestId('onboarding-dismiss'))
    expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument()
  })

  it('calls onDismiss callback when dismissed', () => {
    const onDismiss = jest.fn()
    render(<OnboardingBanner onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('onboarding-dismiss'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not render when sessionStorage shows already dismissed', () => {
    sessionStorage.setItem('onboarding-banner-dismissed', 'true')
    render(<OnboardingBanner />)
    expect(screen.queryByTestId('onboarding-banner')).not.toBeInTheDocument()
  })

  it('persists dismissed state to sessionStorage', () => {
    render(<OnboardingBanner />)
    fireEvent.click(screen.getByTestId('onboarding-dismiss'))
    expect(sessionStorage.getItem('onboarding-banner-dismissed')).toBe('true')
  })
})
