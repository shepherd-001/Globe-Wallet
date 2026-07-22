import { IFiatService, CurrencyCode, Wallet, FiatServiceError } from '../types'
import { MOCK_WALLETS } from '../fixtures'
import { formatCurrency } from '../helpers/format'
import { BaseService } from './base.service'

export class FiatService extends BaseService implements IFiatService {
  private readonly exchangeRates: Record<CurrencyCode, Record<CurrencyCode, number>> = {
    NGN: { NGN: 1, USD: 0.00063, GBP: 0.00050, EUR: 0.00058 },
    USD: { NGN: 1580.5, USD: 1, GBP: 0.79, EUR: 0.92 },
    GBP: { NGN: 2000.6, USD: 1.27, GBP: 1, EUR: 1.16 },
    EUR: { NGN: 1720.0, USD: 1.09, GBP: 0.86, EUR: 1 }
  }

  constructor() {
    super('FiatService')
  }

  getWallets(): Wallet[] {
    return [...MOCK_WALLETS]
  }

  formatMoney(amount: number, currency: CurrencyCode, hidden = false): string {
    return formatCurrency(amount, currency, hidden)
  }

  convertCurrency(from: CurrencyCode, to: CurrencyCode, amount: number): number {
    if (!this.exchangeRates[from] || !this.exchangeRates[from][to]) {
      throw new FiatServiceError(`Exchange rate not available for ${from} to ${to}`)
    }

    return amount * this.exchangeRates[from][to]
  }

  getAccountBalance(): number {
    return this.getWallets().reduce((total, w) => total + this.convertCurrency(w.code, 'USD', w.balance), 0)
  }

  getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
    if (!this.exchangeRates[from] || !this.exchangeRates[from][to]) {
      throw new FiatServiceError(`Exchange rate not available for ${from} to ${to}`)
    }
    return this.exchangeRates[from][to]
  }
}