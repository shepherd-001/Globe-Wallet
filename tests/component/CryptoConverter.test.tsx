import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CryptoConverter } from '../../components/finance/CryptoConverter'
import { FinanceServicesProvider } from '../../hooks/useFinanceServices'
import { FinanceServiceContainer } from '../../lib/services/container'

const mockExchange = {
  estimateSwap: jest.fn().mockResolvedValue({
    from: 'XLM',
    to: 'USDC',
    fromAmount: 100,
    toAmount: 98,
    path: ['XLM', 'USDC'],
    priceImpact: 0.02,
  }),
  executeSwap: jest.fn(),
}

const mockPricing = {
  getAssets: jest.fn().mockReturnValue([]),
  getPrice: jest.fn().mockResolvedValue(0.1),
  formatAsset: jest.fn((amount: number, code: string) => `${amount} ${code}`),
}

const mockServices = new FinanceServiceContainer(
  undefined,
  mockExchange as any,
  undefined,
  mockPricing as any,
)

const renderWithServices = (component: React.ReactNode) => {
  return render(
    <FinanceServicesProvider services={mockServices}>
      {component}
    </FinanceServicesProvider>,
  )
}

describe('CryptoConverter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render converter form', () => {
    renderWithServices(<CryptoConverter />)

    expect(screen.getByTestId('crypto-converter')).toBeInTheDocument()
    expect(screen.getByText('Crypto Converter')).toBeInTheDocument()
    expect(screen.getByTestId('amount-input')).toBeInTheDocument()
    expect(screen.getByTestId('from-asset-select')).toBeInTheDocument()
    expect(screen.getByTestId('to-asset-select')).toBeInTheDocument()
    expect(screen.getByTestId('convert-button')).toBeInTheDocument()
  })

  it('should handle amount input', async () => {
    const user = userEvent.setup()
    renderWithServices(<CryptoConverter />)

    const amountInput = screen.getByTestId('amount-input')
    await user.type(amountInput, '100')

    expect(amountInput).toHaveValue(100)
  })

  it('should swap assets when swap button is clicked', async () => {
    const user = userEvent.setup()
    renderWithServices(<CryptoConverter />)

    const swapButton = screen.getByTestId('swap-button')
    await user.click(swapButton)
    expect(swapButton).toBeInTheDocument()
  })

  it('should perform conversion', async () => {
    const user = userEvent.setup()
    renderWithServices(<CryptoConverter />)

    const amountInput = screen.getByTestId('amount-input')
    const convertButton = screen.getByTestId('convert-button')

    await user.type(amountInput, '100')
    await user.click(convertButton)

    await waitFor(() => {
      expect(mockExchange.estimateSwap).toHaveBeenCalledWith('XLM', 'USDC', 100)
    })

    expect(screen.getByTestId('conversion-result')).toBeInTheDocument()
  })

  it('should disable convert button when invalid input', () => {
    renderWithServices(<CryptoConverter />)
    expect(screen.getByTestId('convert-button')).toBeDisabled()
  })

  it('should have proper accessibility attributes', () => {
    renderWithServices(<CryptoConverter />)
    expect(screen.getByLabelText('Swap assets')).toBeInTheDocument()
  })
})
