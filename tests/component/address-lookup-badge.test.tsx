/**
 * Component tests for AddressLookupBadge — Issue #11
 * Verifies all status states render the correct content and aria attributes.
 */

import { render, screen } from '@testing-library/react'
import React from 'react'
import { AddressLookupBadge } from '../../components/ui/address-lookup-badge'
import type { AddressLookupResult } from '../../lib/types'

const BASE: AddressLookupResult = { status: 'idle', input: '' }

describe('AddressLookupBadge', () => {
  it('renders nothing in idle state', () => {
    const { container } = render(<AddressLookupBadge result={BASE} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows spinner and resolving label during lookup', () => {
    render(<AddressLookupBadge result={{ ...BASE, status: 'resolving', input: 'alice*stellar.org' }} />)
    const el = screen.getByTestId('lookup-resolving')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent(/Resolving address/i)
    expect(el).toHaveAttribute('role', 'status')
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('shows shortened public key when resolved', () => {
    const KEY = 'GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX'
    render(
      <AddressLookupBadge
        result={{ ...BASE, status: 'resolved', input: 'alice*stellar.org', resolved: KEY }}
      />,
    )
    const el = screen.getByTestId('lookup-resolved')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('GDXSPAY')
    expect(el).toHaveTextContent('T6BNRX')
    expect(el).toHaveAttribute('role', 'status')
  })

  it('shows federation memo when present in resolved state', () => {
    const KEY = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
    render(
      <AddressLookupBadge
        result={{
          ...BASE,
          status: 'resolved',
          input: 'test*globe.wallet',
          resolved: KEY,
          federationMemo: 'GLOBE-TEST',
        }}
      />,
    )
    expect(screen.getByTestId('lookup-resolved')).toHaveTextContent('GLOBE-TEST')
  })

  it('shows not-found warning when record is missing', () => {
    render(
      <AddressLookupBadge result={{ ...BASE, status: 'not-found', input: 'x*y.z' }} />,
    )
    const el = screen.getByTestId('lookup-not-found')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent(/No federation record/i)
    expect(el).toHaveAttribute('role', 'alert')
    expect(el).toHaveAttribute('aria-live', 'assertive')
  })

  it('shows error message on error state', () => {
    render(
      <AddressLookupBadge
        result={{ ...BASE, status: 'error', input: 'x*y.z', error: 'Network timeout' }}
      />,
    )
    const el = screen.getByTestId('lookup-error')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Network timeout')
    expect(el).toHaveAttribute('role', 'alert')
  })

  it('shows default error message when error field is missing', () => {
    render(<AddressLookupBadge result={{ ...BASE, status: 'error', input: 'x*y.z' }} />)
    expect(screen.getByTestId('lookup-error')).toHaveTextContent(/Address lookup failed/i)
  })

  it('accepts extra className without crashing', () => {
    render(
      <AddressLookupBadge
        result={{ ...BASE, status: 'resolving', input: 'alice*stellar.org' }}
        className="mt-2 text-blue-500"
      />,
    )
    expect(screen.getByTestId('lookup-resolving')).toHaveClass('mt-2')
  })
})
