import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BalanceCard } from '../../components/finance/BalanceCard'
import { FinanceServicesProvider } from '../../hooks/useFinanceServices'
import { FinanceServiceContainer } from '../../lib/services/container'

const mockPricing = {
  getAssets: jest.fn().mockReturnValue([
    { code: 'XLM', name: 'Stellar Lumens', balance: 1000, priceUsd: 0.10, change24h: 5.0, changePct: 5.0, color: 'bg-blue-500' },
  ]),
  getPrice: jest.fn().mockResolvedValue(0.10),
  formatAsset: jest.fn().mockReturnValue('1000.00 XLM'),
}

const mockFiat = {
  getWallets: jest.fn().mockReturnValue([
    { id: 'w1', code: 'USD', name: 'US Dollar', label: 'US Dollar', symbol: '$', balance: 1000, changePct: 2.0, color: 'bg-blue-500' },
  ]),
  formatMoney: jest.fn().mockReturnValue('$1,000.00'),
  convertCurrency: jest.fn().mockReturnValue(1000),
  getAccountBalance: jest.fn().mockReturnValue(1000),
}

const mockServices = new FinanceServiceContainer(
  undefined,
  undefined,
  undefined,
  mockPricing as any,
  mockFiat as any,
)

const renderWithServices = (component: React.ReactNode) => {
  return render(
    <FinanceServicesProvider services={mockServices}>
      {component}
    </FinanceServicesProvider>,
  )
}

describe('BalanceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render loading state', () => {
    renderWithServices(<BalanceCard title="Test Balance" />)
    expect(screen.getByTestId('balance-card-loading')).toBeInTheDocument()
  })

  it('should render balance data after loading', async () => {
    renderWithServices(<BalanceCard title="Test Balance" showTotal />)

    await waitFor(() => {
      expect(screen.getByTestId('balance-card')).toBeInTheDocument()
    })

    expect(screen.getByText('Test Balance')).toBeInTheDocument()
    expect(screen.getByTestId('total-value')).toBeInTheDocument()
    expect(screen.getByTestId('fiat-total')).toBeInTheDocument()
    expect(screen.getByTestId('crypto-total')).toBeInTheDocument()
  })

  it('should handle refresh button click', async () => {
    const user = userEvent.setup()
    renderWithServices(<BalanceCard title="Test Balance" />)

    await waitFor(() => {
      expect(screen.getByTestId('balance-card')).toBeInTheDocument()
    })

    const refreshButton = screen.getByTestId('refresh-button')
    await user.click(refreshButton)

    expect(mockFiat.getWallets).toHaveBeenCalledTimes(2)
    expect(mockPricing.getAssets).toHaveBeenCalledTimes(2)
  })

  it('should render error state and retry button', async () => {
    const errorFiat = {
      ...mockFiat,
      getWallets: jest.fn().mockImplementation(() => {
        throw new Error('Network error')
      }),
    }

    const errorServices = new FinanceServiceContainer(
      undefined,
      undefined,
      undefined,
      mockPricing as any,
      errorFiat as any,
    )

    render(
      <FinanceServicesProvider services={errorServices}>
        <BalanceCard title="Test Balance" />
      </FinanceServicesProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('balance-card-error')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to load balance data')).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', async () => {
    renderWithServices(<BalanceCard title="Test Balance" />)

    await waitFor(() => {
      expect(screen.getByTestId('balance-card')).toBeInTheDocument()
    })

    const refreshButton = screen.getByTestId('refresh-button')
    expect(refreshButton).toHaveAttribute('aria-label', 'Refresh balances')
  })
})
