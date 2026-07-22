/**
 * Component tests for PageHeader — issue #29
 * Validates rendering, navigation link, accessible back button, and action slot.
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '../../components/app/page-header'

// next/link renders a plain <a> in the jsdom environment
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

describe('PageHeader', () => {
  it('renders the page title', () => {
    render(<PageHeader title="Send" />)
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Send')
  })

  it('back link defaults to /', () => {
    render(<PageHeader title="Send" />)
    expect(screen.getByTestId('page-header-back')).toHaveAttribute('href', '/')
  })

  it('back link uses the provided back prop', () => {
    render(<PageHeader title="Profile" back="/settings" />)
    expect(screen.getByTestId('page-header-back')).toHaveAttribute('href', '/settings')
  })

  it('back link has an accessible aria-label', () => {
    render(<PageHeader title="Receive" />)
    expect(screen.getByRole('link', { name: /go back/i })).toBeInTheDocument()
  })

  it('renders the action slot when provided', () => {
    render(
      <PageHeader
        title="Cards"
        action={<button data-testid="add-card-btn">Add</button>}
      />
    )
    expect(screen.getByTestId('page-header-action')).toBeInTheDocument()
    expect(screen.getByTestId('add-card-btn')).toBeInTheDocument()
  })

  it('does not render action wrapper when no action provided', () => {
    render(<PageHeader title="Send" />)
    expect(screen.queryByTestId('page-header-action')).not.toBeInTheDocument()
  })

  it('header element has correct testid', () => {
    render(<PageHeader title="Test" />)
    expect(screen.getByTestId('page-header')).toBeInTheDocument()
  })
})
