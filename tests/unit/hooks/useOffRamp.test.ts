import { renderHook, act, waitFor } from '@testing-library/react'
import { useOffRamp } from '../../../hooks/useOffRamp'
import type { OffRampPaymentMethod } from '../../../lib/off-ramp-utils'

const METHODS: OffRampPaymentMethod[] = [
  {
    id: 'bank_1',
    type: 'bank',
    name: 'Chase Checking ****1234',
    details: 'ACH Transfer',
    fees: '1.5%',
    processingTime: '1-3 business days',
    limits: { min: 10, max: 10000 },
    enabled: true,
  },
  {
    id: 'bank_2',
    type: 'bank',
    name: 'Wells Fargo Savings ****5678',
    details: 'Wire Transfer',
    fees: '$15 + 1%',
    processingTime: 'Same day',
    limits: { min: 100, max: 50000 },
    enabled: true,
  },
]

describe('useOffRamp', () => {
  beforeEach(() => {
    localStorage.clear()
    global.fetch = jest.fn()
  })

  it('initializes with empty form state', () => {
    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    expect(result.current.amount).toBe('')
    expect(result.current.asset).toBe('XLM')
    expect(result.current.paymentMethodId).toBe('')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.backendError).toBeNull()
    expect(result.current.lastWithdrawal).toBeNull()
    expect(result.current.validation.valid).toBe(false)
    expect(result.current.breakdown).toBeNull()
  })

  it('rehydrates payment method and last withdrawal from localStorage', async () => {
    localStorage.setItem('globe-offramp-selected-method', 'bank_1')
    localStorage.setItem(
      'globe-offramp-last-withdrawal',
      JSON.stringify({
        methodId: 'bank_1',
        methodName: 'Chase',
        asset: 'XLM',
        amount: 50,
        fiatAmount: 5,
        status: 'completed',
        date: '2026-01-01T00:00:00.000Z',
      }),
    )

    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    await waitFor(() => {
      expect(result.current.paymentMethodId).toBe('bank_1')
      expect(result.current.lastWithdrawal?.methodId).toBe('bank_1')
    })
  })

  it('clears invalid withdrawal JSON from localStorage', async () => {
    localStorage.setItem('globe-offramp-last-withdrawal', 'not-json')

    renderHook(() => useOffRamp({ methods: METHODS }))

    await waitFor(() => {
      expect(localStorage.getItem('globe-offramp-last-withdrawal')).toBeNull()
    })
  })

  it('updates amount, asset, payment method, and max amount', () => {
    const { result } = renderHook(() =>
      useOffRamp({
        methods: METHODS,
        balances: { XLM: 500, USDC: 100 },
      }),
    )

    act(() => {
      result.current.setAmount('25')
      result.current.setAsset('USDC')
      result.current.setPaymentMethod('bank_2')
    })

    expect(result.current.amount).toBe('25')
    expect(result.current.asset).toBe('USDC')
    expect(result.current.paymentMethodId).toBe('bank_2')
    expect(localStorage.getItem('globe-offramp-selected-method')).toBe('bank_2')

    act(() => {
      result.current.setMaxAmount()
    })

    expect(result.current.amount).toBe('100')
  })

  it('computes validation and breakdown for valid input', () => {
    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    // 110 XLM * 0.095 USD/XLM = $10.45, above bank_1 min ($10)
    act(() => {
      result.current.setAmount('110')
      result.current.setAsset('XLM')
      result.current.setPaymentMethod('bank_1')
    })

    expect(result.current.validation.valid).toBe(true)
    expect(result.current.breakdown).not.toBeNull()
    expect(result.current.breakdown?.usdValue).toBeGreaterThan(10)
  })

  it('does not submit when validation fails', async () => {
    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    await act(async () => {
      await result.current.submit()
    })

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('submits successfully and persists withdrawal', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            methodId: 'bank_1',
            methodName: 'Chase Checking ****1234',
            asset: 'XLM',
            amount: 110,
            fiatAmount: 10.45,
            status: 'completed',
            hash: '0xabc',
          },
        }),
    })

    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    act(() => {
      result.current.setAmount('110')
      result.current.setPaymentMethod('bank_1')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/off-ramp',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(result.current.amount).toBe('')
    expect(result.current.lastWithdrawal?.hash).toBe('0xabc')
    expect(result.current.isLoading).toBe(false)
    expect(localStorage.getItem('globe-offramp-last-withdrawal')).toContain('0xabc')
  })

  it('sets backendError when API returns failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Withdrawal rejected' }),
    })

    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    act(() => {
      result.current.setAmount('110')
      result.current.setPaymentMethod('bank_1')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(result.current.backendError).toBe('Withdrawal rejected')
    expect(result.current.isLoading).toBe(false)
  })

  it('sets backendError when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    act(() => {
      result.current.setAmount('110')
      result.current.setPaymentMethod('bank_1')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(result.current.backendError).toBe('Network down')
  })

  it('clearError resets backendError', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Failed' }),
    })

    const { result } = renderHook(() => useOffRamp({ methods: METHODS }))

    act(() => {
      result.current.setAmount('110')
      result.current.setPaymentMethod('bank_1')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(result.current.backendError).toBe('Failed')

    act(() => {
      result.current.clearError()
    })

    expect(result.current.backendError).toBeNull()
  })
})
