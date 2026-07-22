/**
 * Level 2 Architecture Sync: Finance Data Layer
 * Synchronized with lib/types.ts and architecture.md
 */

import { CurrencyCode, AssetCode, Wallet, CryptoAsset, Transaction, Contact, SavingsGoal, PaymentCard } from './types'
import { TEST_STELLAR_ADDRESS, MOCK_STELLAR_ACCOUNT, MOCK_MEMO } from './fixtures/stellar'

export const wallets: Wallet[] = [
  { id: 'w1', code: "NGN", name: "Nigerian Naira", balance: 1284500.75, color: "bg-green-500", changePct: 2.4, label: "NGN" },
  { id: 'w2', code: "USD", name: "US Dollar", balance: 4820.4, color: "bg-blue-500", changePct: -1.2, label: "USD" },
  { id: 'w3', code: "GBP", name: "British Pound", balance: 1290.0, color: "bg-indigo-500", changePct: 0.5, label: "GBP" },
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
    category: "deposit",
    name: "Received XLM",
    detail: "From external address",
    currency: "USD"
  },
  {
    id: "t2",
    type: "send",
    amount: 2000,
    asset: "XLM",
    address: "GDXSPAY...",
    date: "Today, 08:15",
    status: "completed",
    category: "transfer",
    name: "Sent XLM",
    detail: "To Stellar account",
    currency: "USD"
  }
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

// Re-exported from the canonical wallet fixture (lib/fixtures/stellar.ts) so the
// receive flow has a single source of truth instead of a second, drifting literal.
export { TEST_STELLAR_ADDRESS }

export const stellarAccount = {
  publicKey: MOCK_STELLAR_ACCOUNT.publicKey,
  memo: MOCK_MEMO,
  network: MOCK_STELLAR_ACCOUNT.network,
}

export const formatMoney = (amount: number, currency: CurrencyCode, hidden = false): string => {
  const symbols: Record<string, string> = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" }
  if (hidden) return `${symbols[currency] || ''}••••••`
  return `${symbols[currency] || ''}${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

export const formatCrypto = (amount: number, code: AssetCode, hidden = false): string => {
  if (hidden) return `•••• ${code}`
  const decimals = code === "XLM" ? 4 : 2
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${code}`
}

export function shortenKey(key: string, lead = 6, tail = 6): string {
  return `${key.slice(0, lead)}…${key.slice(-tail)}`
}

export const savingsGoals: SavingsGoal[] = [
  {
    id: "s1",
    title: "New Laptop",
    saved: 320000,
    target: 850000,
    currency: "NGN",
    apy: 12,
    color: "bg-primary",
  },
  {
    id: "s2",
    title: "Emergency Fund",
    saved: 1500,
    target: 5000,
    currency: "USD",
    apy: 8,
    color: "bg-accent",
  },
  {
    id: "s3",
    title: "Japa Travel",
    saved: 540,
    target: 2000,
    currency: "GBP",
    apy: 6,
    color: "bg-chart-3",
  },
]

export const cards: PaymentCard[] = [
  {
    id: "card1",
    label: "Spending Card",
    type: "physical",
    brand: "Mastercard",
    last4: "4821",
    expiry: "09/27",
    balance: 1284500.75,
    currency: "NGN",
    frozen: false,
    gradient: "from-primary to-accent",
  },
  {
    id: "card2",
    label: "Online USD Card",
    type: "virtual",
    brand: "Visa",
    last4: "7390",
    expiry: "04/26",
    balance: 4820.4,
    currency: "USD",
    frozen: false,
    gradient: "from-foreground to-muted-foreground",
  },
]

export const quickActions = [
  { id: "send", label: "Send", icon: "send" },
  { id: "request", label: "Request", icon: "request" },
  { id: "airtime", label: "Airtime", icon: "airtime" },
  { id: "bills", label: "Bills", icon: "bills" },
] as const

export const conversionRates: Record<AssetCode, Record<AssetCode, number>> = {
  XLM: { XLM: 1, USDC: 0.1185, USDT: 0.1184 },
  USDC: { XLM: 8.4388, USDC: 1, USDT: 0.9994 },
  USDT: { XLM: 8.4459, USDC: 1.0006, USDT: 1 },
}

export interface LegacyOffRampMethod {
  id: string
  type: "bank" | "mobile"
  label: string
  detail: string
  initials: string
}

export const offRampMethods: LegacyOffRampMethod[] = [
  { id: "m1", type: "bank", label: "GTBank • Savings", detail: "•••• 8842", initials: "GT" },
  { id: "m2", type: "bank", label: "Access Bank • Current", detail: "•••• 1129", initials: "AC" },
  { id: "m3", type: "mobile", label: "Opay Wallet", detail: "+234 803 •••• 21", initials: "OP" },
]

export const offRampRates: Record<CurrencyCode, number> = {
  NGN: 1580.5,
  USD: 1,
  GBP: 0.79,
  EUR: 0.92
}

