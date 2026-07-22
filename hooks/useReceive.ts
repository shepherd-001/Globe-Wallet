'use client'

import { useCallback, useMemo, useState } from 'react'
import { useWallet } from './useFinanceServices'
import {
  buildReceiveQRData,
  formatAddressShareText,
  formatPaymentRequestShareText,
  validatePaymentAmount,
} from '../lib/receive-utils'
import { AssetCode, ReceiveQRData } from '../lib/types'

export function useReceive() {
  const { generateAddress, validateAddress, shortenKey } = useWallet()
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)

  const address = generateAddress()
  const hasAccount = Boolean(address) && validateAddress(address)

  const addressQR = useMemo(
    () => buildReceiveQRData(address, 'address'),
    [address]
  )

  const paymentQR = useMemo(
    () => buildReceiveQRData(address, 'payment-request', amount, memo),
    [address, amount, memo]
  )

  const validateAmount = useCallback((value: string) => {
    const result = validatePaymentAmount(value)
    setAmountError(result.valid ? null : result.error ?? null)
    return result.valid
  }, [])

  const handleAmountChange = useCallback(
    (value: string) => {
      setAmount(value)
      if (value.trim()) {
        validateAmount(value)
      } else {
        setAmountError(null)
      }
    },
    [validateAmount]
  )

  const getShareText = useCallback(
    (type: ReceiveQRData['type']) =>
      type === 'address'
        ? formatAddressShareText(address)
        : formatPaymentRequestShareText({ address, amount, memo }),
    [address, amount, memo]
  )

  return {
    address,
    hasAccount,
    shortenKey,
    amount,
    memo,
    amountError,
    addressQR,
    paymentQR,
    setAmount: handleAmountChange,
    setMemo,
    validateAmount,
    getShareText,
    asset: 'XLM' as AssetCode,
  }
}
