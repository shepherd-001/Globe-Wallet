import { useContext, createContext, ReactNode, createElement } from 'react'
import { IFinanceServiceContainer, AssetCode, CurrencyCode } from '../lib/types'
import { financeServices } from '../lib/services/container'

const FinanceServicesContext = createContext<IFinanceServiceContainer>(financeServices)

interface FinanceServicesProviderProps {
  children: ReactNode
  services?: IFinanceServiceContainer
}

export function FinanceServicesProvider({ children, services = financeServices }: FinanceServicesProviderProps) {
  return createElement(FinanceServicesContext.Provider, { value: services }, children)
}

export function useFinanceServices(): IFinanceServiceContainer {
  return useContext(FinanceServicesContext)
}

export function usePricing() {
  const { pricing } = useFinanceServices()
  return {
    getAssets: () => pricing.getAssets(),
    getPrice: (code: AssetCode) => pricing.getPrice(code),
    formatAsset: (amount: number, code: AssetCode, hidden?: boolean) => pricing.formatAsset(amount, code, hidden)
  }
}

export function useAssets() {
  const { exchange, pricing } = useFinanceServices()
  return {
    convert: async (from: AssetCode, to: AssetCode, amount: number) => {
      const estimate = await exchange.estimateSwap(from, to, amount)
      return estimate.toAmount
    },
    format: (amount: number, code: AssetCode, hidden?: boolean) =>
      pricing.formatAsset(amount, code, hidden),
  }
}

export function useWallet() {
  const { wallet } = useFinanceServices()
  return {
    getAccount: () => wallet.getAccountInfo(),
    getBalance: () => wallet.getBalance(),
    sendPayment: (dest: string, amt: number, asset: AssetCode, memo?: string) => wallet.sendPayment(dest, amt, asset, memo),
    generateAddress: () => wallet.generateReceiveAddress(),
    validateAddress: (address: string) => wallet.validateAddress(address),
    shortenKey: (key: string, lead?: number, tail?: number) => wallet.shortenKey(key, lead, tail),
    getHistory: () => wallet.getTransactionHistory()
  }
}

export function useExchange() {
  const { exchange } = useFinanceServices()
  return {
    estimate: (from: AssetCode, to: AssetCode, amt: number) => exchange.estimateSwap(from, to, amt),
    execute: (from: AssetCode, to: AssetCode, amt: number) => exchange.executeSwap(from, to, amt)
  }
}

export function useOffRamp() {
  const { offRamp } = useFinanceServices()
  return {
    initiate: (amt: number, asset: AssetCode, mid: string, cur: CurrencyCode) => offRamp.initiateWithdrawal(amt, asset, mid, cur),
    getRates: () => offRamp.getRates()
  }
}

export function useSoroban() {
  const { soroban } = useFinanceServices()
  return {
    createGoal: (amt: number, asset: AssetCode, deadline: number) => soroban.createSavingsGoal(amt, asset, deadline),
    stake: (amt: number, asset: AssetCode) => soroban.stakeAssets(amt, asset)
  }
}

export function useWallets() {
  const { fiat } = useFinanceServices()
  return {
    getWallets: () => fiat.getWallets(),
    formatMoney: (amount: number, currency: CurrencyCode, hidden?: boolean) =>
      fiat.formatMoney(amount, currency, hidden),
    convertCurrency: (from: CurrencyCode, to: CurrencyCode, amount: number) =>
      fiat.convertCurrency(from, to, amount),
    getAccountBalance: () => fiat.getAccountBalance(),
  }
}