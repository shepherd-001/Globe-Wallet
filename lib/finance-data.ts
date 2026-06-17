/**
 * Level 2 Architecture Sync: Finance Data Layer
 * Synchronized with lib/types.ts and architecture.md
 */

import { CurrencyCode, AssetCode, Wallet, CryptoAsset, Transaction, Contact, SavingsGoal, PaymentCard } from './types'

export const wallets: Wallet[] = [
  { id: 'w1', code: "NGN", name: "Nigerian Naira", label: "Naira", balance: 1284500.75, color: "bg-green-500", symbol: "₦", changePct: 2.4 },
  { id: 'w2', code: "USD", name: "US Dollar", label: "Dollar", balance: 4820.4, color: "bg-blue-500", symbol: "$", changePct: 1.1 },
  { id: 'w3', code: "GBP", name: "British Pound", label: "Pound", balance: 1290.0, color: "bg-indigo-500", symbol: "£", changePct: -0.6 },
]

export const savingsGoals: SavingsGoal[] = [
  { id: 'sg1', title: 'Emergency fund', saved: 320000, target: 500000, currency: 'NGN', apy: 8.5, color: 'bg-primary' },
  { id: 'sg2', title: 'Travel', saved: 1500, target: 3000, currency: 'USD', apy: 6.0, color: 'bg-accent' },
  { id: 'sg3', title: 'New laptop', saved: 540, target: 1200, currency: 'USD', apy: 5.5, color: 'bg-indigo-500' },
]

export const cards: PaymentCard[] = [
  {
    id: 'c1',
    label: 'Globe Virtual',
    type: 'virtual',
    brand: 'Visa',
    last4: '4291',
    expiry: '09/28',
    balance: 8420,
    currency: 'USD',
    frozen: false,
    gradient: 'from-indigo-600 to-violet-700',
  },
  {
    id: 'c2',
    label: 'Globe Physical',
    type: 'physical',
    brand: 'Mastercard',
    last4: '8834',
    expiry: '03/27',
    balance: 215000,
    currency: 'NGN',
    frozen: false,
    gradient: 'from-emerald-600 to-teal-700',
  },
]

export const transactions: Transaction[] = [
  {
    id: "t1",
    type: "receive",
    amount: 75000,
    asset: "XLM",
    address: "GDXSPAY...",
    date: "Today, 09:42",
    status: "completed",
    name: "Adaeze Okoro",
    detail: "Transfer from @adaeze",
    category: "transfer",
    currency: "NGN",
  },
  {
    id: "t2",
    type: "send",
    amount: 2000,
    asset: "XLM",
    address: "GDXSPAY...",
    date: "Today, 08:15",
    status: "completed",
    name: "MTN Airtime",
    detail: "Mobile top-up",
    category: "airtime",
    currency: "NGN",
  },
  {
    id: "t3",
    type: "send",
    amount: 150,
    asset: "USDC",
    address: "GABC...XYZ1",
    date: "Yesterday",
    status: "completed",
    name: "Netflix",
    detail: "Subscription",
    category: "bills",
    currency: "USD",
  },
  {
    id: "t4",
    type: "receive",
    amount: 500,
    asset: "USDC",
    address: "GDXSPAY...",
    date: "Yesterday",
    status: "completed",
    name: "Salary deposit",
    detail: "Monthly payroll",
    category: "deposit",
    currency: "USD",
  },
]

export const contacts: Contact[] = [
  { id: "c1", name: "Adaeze Okoro", handle: "@adaeze", initials: "AO" },
  { id: "c2", name: "James Bello", handle: "@jbello", initials: "JB" },
]

export const cryptoAssets: CryptoAsset[] = [
  {
    code: "XLM",
    name: "Stellar Lumens",
    balance: 4250.5,
    priceUsd: 0.1185,
    change24h: 4.7,
    changePct: 4.7,
    color: "bg-foreground",
  },
  {
    code: "USDC",
    name: "USD Coin",
    balance: 1820.0,
    priceUsd: 1.0,
    change24h: 0.0,
    changePct: 0.0,
    color: "bg-primary",
  },
  {
    code: "USDT",
    name: "Tether USD",
    balance: 540.25,
    priceUsd: 1.0,
    change24h: 0.01,
    changePct: 0.01,
    color: "bg-accent",
  },
]

export const TEST_STELLAR_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

export const stellarAccount = {
  publicKey: TEST_STELLAR_ADDRESS,
  memo: "STLP-2048",
  network: "Stellar Public Network",
}

export const formatMoney = (amount: number, currency: CurrencyCode, hidden = false): string => {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" }
  if (hidden) return `${symbols[currency] || ''}••••••`
  return `${symbols[currency] || ''}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

export const formatCrypto = (amount: number, code: AssetCode, hidden = false): string => {
  if (hidden) return `•••• ${code}`
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: code === "XLM" ? 4 : 2,
  })} ${code}`
}

export function shortenKey(key: string, lead = 6, tail = 6): string {
  return `${key.slice(0, lead)}…${key.slice(-tail)}`
}
