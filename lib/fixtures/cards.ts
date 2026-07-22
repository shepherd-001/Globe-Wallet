import type { PaymentCard, CurrencyCode } from '../types'

export const MOCK_PAYMENT_CARDS: PaymentCard[] = [
  {
    id: 'card1',
    label: 'Spending Card',
    type: 'physical',
    brand: 'Mastercard',
    last4: '4821',
    expiry: '09/27',
    balance: 1284500.75,
    currency: 'NGN' as CurrencyCode,
    frozen: false,
    gradient: 'from-primary to-accent',
  },
  {
    id: 'card2',
    label: 'Online USD Card',
    type: 'virtual',
    brand: 'Visa',
    last4: '7390',
    expiry: '04/26',
    balance: 4820.4,
    currency: 'USD' as CurrencyCode,
    frozen: false,
    gradient: 'from-foreground to-muted-foreground',
  },
]
