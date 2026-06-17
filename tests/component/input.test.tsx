import { render, screen } from '@testing-library/react'
import { Input } from '../../components/ui/input'

describe('Input', () => {
  it('renders error message with alert role when errorMessage is set', () => {
    render(
      <Input
        id="amount"
        aria-label="Amount"
        errorMessage="Amount must be greater than zero"
        data-testid="amount-input"
      />,
    )

    expect(screen.getByTestId('amount-input-error')).toHaveTextContent('Amount must be greater than zero')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('sets aria-invalid when errorMessage is present', () => {
    render(<Input id="addr" errorMessage="Invalid address" data-testid="addr-input" />)
    expect(screen.getByTestId('addr-input')).toHaveAttribute('aria-invalid', 'true')
  })

  it('supports keyboard focus', () => {
    render(<Input aria-label="Recipient Address" data-testid="recipient" />)
    const input = screen.getByTestId('recipient')
    input.focus()
    expect(input).toHaveFocus()
  })
})
