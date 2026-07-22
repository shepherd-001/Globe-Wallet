import type { SavingsGoal, CurrencyCode } from '../types'

export const MOCK_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 's1',
    title: 'New Laptop',
    saved: 320000,
    target: 850000,
    currency: 'NGN' as CurrencyCode,
    apy: 12,
    color: 'bg-primary',
  },
  {
    id: 's2',
    title: 'Emergency Fund',
    saved: 1500,
    target: 5000,
    currency: 'USD' as CurrencyCode,
    apy: 8,
    color: 'bg-accent',
  },
  {
    id: 's3',
    title: 'Japa Travel',
    saved: 540,
    target: 2000,
    currency: 'GBP' as CurrencyCode,
    apy: 6,
    color: 'bg-chart-3',
  },
]
