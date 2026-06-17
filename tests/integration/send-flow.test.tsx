/**
 * Integration tests for SendForm — issue #23
 * Verifies full UI → /api/send interaction using mocked fetch (MSW-style).
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SendForm } from '../../components/app/send-form'
import { FinanceServicesProvider } from '../../hooks/useFinanceServices'
import { FinanceServiceContainer } from '../../lib/services/container'
import { Contact } from '../../lib/types'

const VALID_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

jest.mock('../../lib/services/contact.service', () => {
  const contacts: Contact[] = [
    { id: 'c1', name: 'Adaeze Okoro', handle: '@adaeze', initials: 'AO', address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' },
  ]
  return {
    ContactService: jest.fn(),
    contactService: {
      getContacts: () => contacts,
      search: (q: string) =>
        q.trim() ? contacts.filter(c => c.name.toLowerCase().includes(q.toLowerCase())) : contacts,
      getById: (id: string) => contacts.find(c => c.id === id),
    },
  }
})

function buildMockContainer(overrides: Record<string, any> = {}) {
  const sendPayment = overrides.sendPayment ?? jest.fn().mockResolvedValue({ status: 'completed', hash: '0xhash', success: true })
  const validateAddress = overrides.validateAddress ?? jest.fn().mockReturnValue(true)

  const wallet = {
    sendPayment,
    validateAddress,
    getAccountInfo: jest.fn().mockReturnValue({ publicKey: VALID_ADDRESS, name: 'P', isFunded: true }),
    getBalance: jest.fn().mockResolvedValue([]),
    generateReceiveAddress: jest.fn().mockReturnValue(VALID_ADDRESS),
    getTransactionHistory: jest.fn().mockResolvedValue([]),
    shortenKey: jest.fn((k: string) => k.slice(0, 6) + '…'),
  }
  const pricing = {
    getAssets: jest.fn().mockReturnValue([
      { code: 'XLM', name: 'Stellar Lumens', balance: 5000, priceUsd: 0.12, change24h: 0, color: '' },
    ]),
    getPrice: jest.fn().mockResolvedValue(0.12),
    formatAsset: jest.fn((a: number, c: string) => `${a} ${c}`),
  }
  const fiat = {
    getWallets: jest.fn().mockReturnValue([]),
    convertCurrency: jest.fn().mockReturnValue(0),
    getExchangeRate: jest.fn().mockReturnValue(1),
    getAccountBalance: jest.fn().mockReturnValue(0),
  }
  return { container: new FinanceServiceContainer(wallet as any, undefined, undefined, pricing as any, fiat as any), sendPayment, validateAddress }
}

function renderWith(container: FinanceServiceContainer) {
  return render(
    <FinanceServicesProvider services={container}>
      <SendForm />
    </FinanceServicesProvider>
  )
}

async function advanceToConfirm(addressVal = VALID_ADDRESS, amountVal = '25') {
  const addr = screen.queryByLabelText(/Recipient Address/i)
  if (addr) fireEvent.change(addr, { target: { value: addressVal } })
  fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: amountVal } })
  fireEvent.click(screen.getByTestId('review-button'))
  await waitFor(() => screen.getByTestId('confirm-send-button'))
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('SendFlow Integration — happy path', () => {
  it('completes full UI → service send flow', async () => {
    const { container, sendPayment } = buildMockContainer()
    renderWith(container)

    await advanceToConfirm(VALID_ADDRESS, '25')
    expect(screen.getByTestId('send-summary')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('confirm-send-button'))

    await waitFor(() => {
      expect(sendPayment).toHaveBeenCalledWith(VALID_ADDRESS, 25, 'XLM', undefined)
      expect(screen.getByTestId('send-success')).toBeInTheDocument()
    })
  })

  it('passes memo through to service', async () => {
    const { container, sendPayment } = buildMockContainer()
    renderWith(container)

    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: VALID_ADDRESS } })
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Memo/i), { target: { value: 'invoice-99' } })
    fireEvent.click(screen.getByTestId('review-button'))
    await waitFor(() => screen.getByTestId('confirm-send-button'))
    fireEvent.click(screen.getByTestId('confirm-send-button'))

    await waitFor(() =>
      expect(sendPayment).toHaveBeenCalledWith(VALID_ADDRESS, 10, 'XLM', 'invoice-99')
    )
  })

  it('sends via selected contact address', async () => {
    const { container, sendPayment } = buildMockContainer()
    renderWith(container)

    await userEvent.type(screen.getByTestId('contact-search'), 'Ada')
    fireEvent.click(screen.getByTestId('contact-option-c1'))
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '5' } })
    fireEvent.click(screen.getByTestId('review-button'))
    await waitFor(() => screen.getByTestId('confirm-send-button'))
    fireEvent.click(screen.getByTestId('confirm-send-button'))

    await waitFor(() =>
      expect(sendPayment).toHaveBeenCalledWith(VALID_ADDRESS, 5, 'XLM', undefined)
    )
  })
})

describe('SendFlow Integration — validation failure', () => {
  it('blocks advance on invalid address and does not call sendPayment', async () => {
    const { container, sendPayment } = buildMockContainer({ validateAddress: jest.fn().mockReturnValue(false) })
    renderWith(container)

    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: 'bad-addr' } })
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '10' } })
    fireEvent.click(screen.getByTestId('review-button'))

    await waitFor(() => expect(screen.getByTestId('send-error')).toBeInTheDocument())
    expect(sendPayment).not.toHaveBeenCalled()
    expect(screen.queryByTestId('confirm-send-button')).not.toBeInTheDocument()
  })

  it('blocks on insufficient balance', async () => {
    const { container, sendPayment } = buildMockContainer()
    renderWith(container)

    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: VALID_ADDRESS } })
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '9999999' } })
    fireEvent.click(screen.getByTestId('review-button'))

    await waitFor(() => expect(screen.getByTestId('send-error')).toHaveTextContent(/Insufficient/i))
    expect(sendPayment).not.toHaveBeenCalled()
  })
})

describe('SendFlow Integration — API/service failure', () => {
  it('shows error and returns to form when service throws', async () => {
    const { container } = buildMockContainer({
      sendPayment: jest.fn().mockRejectedValue(new Error('Horizon timeout')),
    })
    renderWith(container)

    await advanceToConfirm()
    fireEvent.click(screen.getByTestId('confirm-send-button'))

    await waitFor(() => {
      expect(screen.getByTestId('send-error')).toHaveTextContent(/Horizon timeout/i)
      expect(screen.getByTestId('review-button')).toBeInTheDocument()
    })
  })

  it('shows generic error when service throws without message', async () => {
    const { container } = buildMockContainer({
      sendPayment: jest.fn().mockRejectedValue({}),
    })
    renderWith(container)

    await advanceToConfirm()
    fireEvent.click(screen.getByTestId('confirm-send-button'))

    await waitFor(() =>
      expect(screen.getByTestId('send-error')).toHaveTextContent(/Failed to send payment/i)
    )
  })
})

describe('SendFlow Integration — optimistic UI', () => {
  it('back button from confirm step preserves entered values', async () => {
    const { container } = buildMockContainer()
    renderWith(container)

    fireEvent.change(screen.getByLabelText(/Recipient Address/i), { target: { value: VALID_ADDRESS } })
    fireEvent.change(screen.getByLabelText(/Amount/i), { target: { value: '77' } })
    fireEvent.click(screen.getByTestId('review-button'))
    await waitFor(() => screen.getByTestId('back-button'))
    fireEvent.click(screen.getByTestId('back-button'))

    expect(screen.getByLabelText(/Amount/i)).toHaveValue(77)
  })
})
