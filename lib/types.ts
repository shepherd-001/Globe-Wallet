/**
 * Level 2 Architecture Sync: Enterprise Interfaces
 * Consolidated and synced with architecture.md and issue-27.md
 */

export type AssetCode = 'XLM' | 'USDC' | 'USDT' | 'NGN' | 'USD' | 'EUR'
export type CurrencyCode = 'NGN' | 'USD' | 'EUR' | 'GBP'
export type TransactionCategory = 'transfer' | 'airtime' | 'bills' | 'savings' | 'card' | 'deposit'
export type TransactionDirection = 'in' | 'out'

export interface StellarAccount {
  publicKey: string
  name: string
  isFunded: boolean
}

export interface Wallet {
  id: string
  name: string
  /** Display label; defaults to `name` in UI helpers */
  label?: string
  code: CurrencyCode
  balance: number
  color: string
  symbol?: string
  changePct?: number
}

export interface CryptoAsset {
  code: AssetCode
  name: string
  balance: number
  priceUsd: number
  change24h: number
  /** UI alias for 24h change percentage */
  changePct?: number
  color: string
}

export interface Contact {
  id: string
  name: string
  handle: string
  initials: string
  address?: string
}

/** Describes the state of the contact picker in the send form */
export interface ContactsState {
  contacts: Contact[]
  selected: Contact | null
  query: string
  loading: boolean
}

/** Payload passed to the send confirmation step */
export interface SendConfirmation {
  recipient: string
  recipientLabel?: string
  amount: number
  asset: AssetCode
  memo?: string
  estimatedFee: number
}

/** Request body for /api/send */
export interface SendRequest {
  destination: string
  amount: number
  asset: AssetCode
  memo?: string
}

/** Response from /api/send */
export interface SendResponse {
  success: boolean
  hash?: string
  status?: 'completed' | 'pending' | 'failed'
  error?: string
}

export interface SavingsGoal {
  id: string
  title: string
  saved: number
  target: number
  currency: CurrencyCode
  apy: number
  color: string
}

export interface PaymentCard {
  id: string
  label: string
  type: "virtual" | "physical"
  brand: "Visa" | "Mastercard"
  last4: string
  expiry: string
  balance: number
  currency: CurrencyCode
  frozen: boolean
  gradient: string
}

export interface Balance {
  asset: AssetCode
  amount: number
  priceUsd: number
}

export interface Transaction {
  id: string
  type: 'send' | 'receive' | 'convert' | 'withdraw'
  amount: number
  asset: AssetCode
  address: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  stellarHash?: string
  /** Human-readable counterparty or merchant name */
  name?: string
  /** Secondary line (memo, category detail, shortened address) */
  detail?: string
  category?: TransactionCategory
  /** Fiat display currency when amount is shown in local money */
  currency?: CurrencyCode
}

export interface TransactionsQuery {
  type?: TransactionDirection
  category?: TransactionCategory
  limit?: number
}

export interface TransactionsResponse {
  success: boolean
  data?: Transaction[]
  error?: string
}

export interface SwapEstimate {
  from: AssetCode
  to: AssetCode
  fromAmount: number
  toAmount: number
  path: AssetCode[]
  priceImpact: number
}

export interface TransactionResult {
  success: boolean
  hash?: string
  error?: string
  status?: 'completed' | 'pending' | 'failed'
}

export class StellarServiceError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'StellarServiceError'
  }
}

// Service Interfaces
export interface IWalletService {
  getAccountInfo(): StellarAccount
  getBalance(): Promise<Balance[]>
  sendPayment(destination: string, amount: number, asset: AssetCode, memo?: string): Promise<TransactionResult>
  generateReceiveAddress(): string
  validateAddress(address: string): boolean
  getTransactionHistory(): Promise<Transaction[]>
  shortenKey(key: string, lead?: number, tail?: number): string
}

export interface IPricingService {
  getAssets(): any[]
  getPrice(code: AssetCode): Promise<number>
  formatAsset(amount: number, code: AssetCode, hidden?: boolean): string
}

export interface IExchangeService {
  estimateSwap(from: AssetCode, to: AssetCode, amount: number): Promise<SwapEstimate>
  executeSwap(from: AssetCode, to: AssetCode, amount: number): Promise<TransactionResult>
}

export interface IOffRampService {
  initiateWithdrawal(amount: number, asset: AssetCode, methodId: string, currency: CurrencyCode): Promise<TransactionResult>
  getRates(): Promise<Record<string, number>>
}

export interface ISorobanService {
  createSavingsGoal(amount: number, asset: AssetCode, deadline: number): Promise<TransactionResult>
  stakeAssets(amount: number, asset: AssetCode): Promise<TransactionResult>
}

export interface IFiatService {
  getAccountBalance(): number
  getWallets(): Wallet[]
  formatMoney(amount: number, currency: CurrencyCode, hidden?: boolean): string
  convertCurrency(from: CurrencyCode, to: CurrencyCode, amount: number): number
}

export interface MergeAnalyticsPayload {
  event: 'merge'
  repository: string
  branch: string
  commit: string
  timestamp: string
  author: string
  issue: number
  status: 'success' | 'failure'
  coverage_verified: boolean
}

// Container Interface
export interface IFinanceServiceContainer {
  wallet: IWalletService
  pricing: IPricingService
  exchange: IExchangeService
  offRamp: IOffRampService
  fiat: IFiatService
  soroban: ISorobanService
}