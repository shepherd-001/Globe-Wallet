import { render, screen } from '@testing-library/react'
import { QuickActions } from '../../components/app/quick-actions'

describe('QuickActions (Issue #14)', () => {
  it('should render all 4 actions', () => {
    render(<QuickActions />)
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
  })

  it('should have correct navigation links', () => {
    render(<QuickActions />)

    expect(screen.getByTestId('quick-action-send')).toHaveAttribute('href', '/send')
    expect(screen.getByTestId('quick-action-receive')).toHaveAttribute('href', '/receive')
    expect(screen.getByTestId('quick-action-convert')).toHaveAttribute('href', '/convert')
    expect(screen.getByTestId('quick-action-cash-out')).toHaveAttribute('href', '/off-ramp')
  })

  it('should display all action labels', () => {
    render(<QuickActions />)
    expect(screen.getByText('Send')).toBeInTheDocument()
    expect(screen.getByText('Receive')).toBeInTheDocument()
    expect(screen.getByText('Convert')).toBeInTheDocument()
    expect(screen.getByText('Cash Out')).toBeInTheDocument()
  })
})
