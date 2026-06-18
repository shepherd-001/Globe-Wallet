/**
 * Issue #18 Enterprise Upgrade — Type System
 * Expanded and synced with architecture.md, issue-18.md, and all service layers.
 */

export type AssetCode = "XLM" | "USDC" | "USDT" | "NGN" | "USD" | "EUR";
export type CurrencyCode = "NGN" | "USD" | "EUR" | "GBP";

export type TransactionCategory =
  | "payment"
  | "exchange"
  | "withdrawal"
  | "deposit"
  | "transfer"
  | "airtime"
  | "bills"
  | "savings"
  | "card";

// ── Domain Models ───────────────────────────────────────────────────────────

export interface StellarAccount {
  publicKey: string;
  name: string;
  network: string;
  isFunded: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  code: CurrencyCode;
  balance: number;
  color: string;
  /** Weekly change percentage, optional legacy field */
  changePct?: number;
  label?: string;
  symbol?: string;
}

export interface CryptoAsset {
  code: AssetCode;
  name: string;
  balance: number;
  priceUsd: number;
  change24h: number;
  color: string;
  /** Percentage change, alias for compatibility with older components */
  changePct?: number;
}

export interface Contact {
  id: string;
  name: string;
  handle: string;
  initials: string;
  address?: string;
}

/** Describes the state of the contact picker in the send form */
export interface ContactsState {
  contacts: Contact[];
  selected: Contact | null;
  query: string;
  loading: boolean;
}

/** Payload passed to the send confirmation step */
export interface SendConfirmation {
  recipient: string;
  recipientLabel?: string;
  amount: number;
  asset: AssetCode;
  memo?: string;
  estimatedFee: number;
}

/** Request body for /api/send */
export interface SendRequest {
  destination: string;
  amount: number;
  asset: AssetCode;
  memo?: string;
}

/** Response from /api/send */
export interface SendResponse {
  success: boolean;
  hash?: string;
  status?: "completed" | "pending" | "failed";
  error?: string;
}

export interface OffRampRequest {
  asset: AssetCode;
  amount: number;
  paymentMethodId: string;
  fiatAmount: number;
}

export interface OffRampResponse {
  success: boolean;
  data?: {
    methodId: string;
    methodName: string;
    asset: AssetCode;
    amount: number;
    fiatAmount: number;
    status?: "completed" | "pending" | "failed";
    hash?: string;
  };
  error?: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  saved: number;
  target: number;
  currency: CurrencyCode;
  apy: number;
  color: string;
}

export interface PaymentCard {
  id: string;
  label: string;
  type: "virtual" | "physical";
  brand: "Visa" | "Mastercard";
  last4: string;
  expiry: string;
  balance: number;
  currency: CurrencyCode;
  frozen: boolean;
  gradient: string;
}

export interface Balance {
  asset: AssetCode;
  amount: number;
  priceUsd: number;
}

export interface Transaction {
  id: string;
  /** Crypto-style type used by WalletService */
  type: "send" | "receive" | "convert" | "withdraw" | "in" | "out";
  amount: number;
  asset: AssetCode;
  /** Fiat currency for the legacy TransactionList view */
  currency?: CurrencyCode;
  address: string;
  date: string;
  status: "completed" | "pending" | "failed";
  stellarHash?: string;
  /** Categorisation for filtering and display */
  category?: TransactionCategory;
  /** Human-readable display name for the transaction */
  name?: string;
  /** Additional transaction detail text */
  detail?: string;
}

export interface SwapEstimate {
  from: AssetCode;
  to: AssetCode;
  fromAmount: number;
  toAmount: number;
  path: AssetCode[];
  priceImpact: number;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  status?: "completed" | "pending" | "failed";
}

export interface FeeEstimate {
  base: number;
  network: number;
  total: number;
  asset: AssetCode;
  /** Estimated time in seconds */
  estimatedSeconds: number;
}

export interface OffRampMethod {
  id: string;
  name: string;
  description: string;
  currency: CurrencyCode;
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fee: number;
}

// ── Error Classes ────────────────────────────────────────────────────────────

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class StellarServiceError extends ServiceError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "StellarServiceError";
  }
}

export class WalletServiceError extends ServiceError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "WalletServiceError";
  }
}

export class ExchangeServiceError extends ServiceError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "ExchangeServiceError";
  }
}

export class OffRampServiceError extends ServiceError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "OffRampServiceError";
  }
}

export class AssetServiceError extends ServiceError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "AssetServiceError";
  }
}

export class FiatServiceError extends ServiceError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "FiatServiceError";
  }
}

// ── Service Interfaces ───────────────────────────────────────────────────────

export interface IWalletService {
  getAccountInfo(): StellarAccount;
  getBalance(): Promise<Balance[]>;
  sendPayment(
    destination: string,
    amount: number,
    asset: AssetCode,
    memo?: string,
  ): Promise<TransactionResult>;
  generateReceiveAddress(): string;
  validateAddress(address: string): boolean;
  getTransactionHistory(): Promise<Transaction[]>;
  shortenKey(key: string, lead?: number, tail?: number): string;
}

export interface IPricingService {
  getAssets(): CryptoAsset[];
  getPrice(code: AssetCode): Promise<number>;
  formatAsset(amount: number, code: AssetCode, hidden?: boolean): string;
}

export interface IExchangeService {
  estimateSwap(
    from: AssetCode,
    to: AssetCode,
    amount: number,
  ): Promise<SwapEstimate>;
  executeSwap(
    from: AssetCode,
    to: AssetCode,
    amount: number,
  ): Promise<TransactionResult>;
}

export interface IOffRampService {
  initiateWithdrawal(
    amount: number,
    asset: AssetCode,
    methodId: string,
    currency: CurrencyCode,
  ): Promise<TransactionResult>;
  getRates(): Promise<Record<string, number>>;
  getMethods(): OffRampMethod[];
}

export interface ISorobanService {
  createSavingsGoal(
    amount: number,
    asset: AssetCode,
    deadline: number,
  ): Promise<TransactionResult>;
  stakeAssets(amount: number, asset: AssetCode): Promise<TransactionResult>;
}

export interface IFiatService {
  getWallets(): Wallet[];
  formatMoney(amount: number, currency: CurrencyCode, hidden?: boolean): string;
  convertCurrency(from: CurrencyCode, to: CurrencyCode, amount: number): number;
  getAccountBalance(): number;
}

export interface IAssetService {
  getAssets(): CryptoAsset[];
  getAssetPrice(code: AssetCode): Promise<number>;
  formatAsset(amount: number, code: AssetCode, hidden?: boolean): string;
  convertAsset(from: AssetCode, to: AssetCode, amount: number): number;
}

export interface IStellarService {
  getAccountInfo(): StellarAccount;
  generateReceiveAddress(): string;
  validateAddress(address: string): boolean;
  shortenKey(key: string, lead?: number, tail?: number): string;
  getOffRampMethods(): OffRampMethod[];
  getOffRampRate(currency: CurrencyCode): number;
}

// ── Container Interface ──────────────────────────────────────────────────────

export interface IFinanceServiceContainer {
  wallet: IWalletService;
  pricing: IPricingService;
  exchange: IExchangeService;
  offRamp: IOffRampService;
  fiat: IFiatService;
  soroban: ISorobanService;

  // Legacy compatibility
  asset: IAssetService;
  stellar: IStellarService;
}
