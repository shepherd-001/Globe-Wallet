import type { Wallet, CurrencyCode } from '../types'

export const MOCK_WALLETS: Wallet[] = [
  {
    id: 'w1',
    code: 'NGN' as CurrencyCode,
    name: 'Nigerian Naira',
    balance: 1284500.75,
    color: 'bg-green-500',
    changePct: 2.4,
    label: 'NGN',
  },
  {
    id: 'w2',
    code: 'USD' as CurrencyCode,
    name: 'US Dollar',
    balance: 4820.4,
    color: 'bg-blue-500',
    changePct: -1.2,
    label: 'USD',
  },
  {
    id: 'w3',
    code: 'GBP' as CurrencyCode,
    name: 'British Pound',
    balance: 1290.0,
    color: 'bg-indigo-500',
    changePct: 0.5,
    label: 'GBP',
  },
]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
}
