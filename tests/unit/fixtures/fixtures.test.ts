import { MOCK_BALANCES, MOCK_TOTAL_USD_VALUE } from '../../../lib/fixtures/balances'
import { MOCK_TRANSACTIONS, MOCK_TRANSACTIONS_COMPACT } from '../../../lib/fixtures/transactions'
import { MOCK_WALLETS } from '../../../lib/fixtures/wallets'
import { MOCK_CRYPTO_ASSETS } from '../../../lib/fixtures/assets'
import { MOCK_CONTACTS } from '../../../lib/fixtures/contacts'
import { MOCK_CONVERSION_RATES, MOCK_SIMPLE_RATES, MOCK_XLM_USD_RATE } from '../../../lib/fixtures/rates'
import { TEST_STELLAR_ADDRESS, MOCK_STELLAR_ACCOUNT } from '../../../lib/fixtures/stellar'
import { MOCK_SAVINGS_GOALS } from '../../../lib/fixtures/savings'
import { MOCK_PAYMENT_CARDS } from '../../../lib/fixtures/cards'
import { FixtureFactory } from '../../../lib/fixtures/factory'

describe('Centralized Fixtures - Balances', () => {
  it('should contain 3 default balances', () => {
    expect(MOCK_BALANCES).toHaveLength(3)
  })

  it('should have valid Balance shape', () => {
    for (const b of MOCK_BALANCES) {
      expect(b).toHaveProperty('asset')
      expect(b).toHaveProperty('amount')
      expect(b).toHaveProperty('priceUsd')
      expect(typeof b.asset).toBe('string')
      expect(typeof b.amount).toBe('number')
      expect(typeof b.priceUsd).toBe('number')
      expect(b.amount).toBeGreaterThan(0)
    }
  })

  it('should have XLM as the first balance', () => {
    expect(MOCK_BALANCES[0].asset).toBe('XLM')
    expect(MOCK_BALANCES[0].amount).toBe(4250.5)
  })

  it('should have a valid total USD value', () => {
    expect(MOCK_TOTAL_USD_VALUE).toBeGreaterThan(0)
    expect(typeof MOCK_TOTAL_USD_VALUE).toBe('number')
  })
})

describe('Centralized Fixtures - Transactions', () => {
  it('should contain 4 detailed transactions', () => {
    expect(MOCK_TRANSACTIONS).toHaveLength(4)
  })

  it('should have valid Transaction shape', () => {
    for (const tx of MOCK_TRANSACTIONS) {
      expect(tx).toHaveProperty('id')
      expect(tx).toHaveProperty('type')
      expect(tx).toHaveProperty('amount')
      expect(tx).toHaveProperty('asset')
      expect(tx).toHaveProperty('status')
      expect(typeof tx.id).toBe('string')
      expect(typeof tx.amount).toBe('number')
    }
  })

  it('should include at least one receive and one send', () => {
    const types = MOCK_TRANSACTIONS.map((t) => t.type)
    expect(types).toContain('receive')
    expect(types).toContain('send')
  })

  it('should have compact transaction set', () => {
    expect(MOCK_TRANSACTIONS_COMPACT).toHaveLength(2)
  })

  it('should include all required category types', () => {
    const categories = MOCK_TRANSACTIONS.map((t) => t.category)
    expect(categories).toContain('deposit')
    expect(categories).toContain('payment')
    expect(categories).toContain('exchange')
    expect(categories).toContain('withdrawal')
  })
})

describe('Centralized Fixtures - Wallets', () => {
  it('should contain 3 wallets', () => {
    expect(MOCK_WALLETS).toHaveLength(3)
  })

  it('should have valid Wallet shape', () => {
    for (const w of MOCK_WALLETS) {
      expect(w).toHaveProperty('id')
      expect(w).toHaveProperty('code')
      expect(w).toHaveProperty('name')
      expect(w).toHaveProperty('balance')
      expect(w).toHaveProperty('color')
      expect(typeof w.id).toBe('string')
      expect(typeof w.balance).toBe('number')
    }
  })

  it('should cover NGN, USD, and GBP currencies', () => {
    const codes = MOCK_WALLETS.map((w) => w.code)
    expect(codes).toContain('NGN')
    expect(codes).toContain('USD')
    expect(codes).toContain('GBP')
  })

  it('should have non-negative balances', () => {
    for (const w of MOCK_WALLETS) {
      expect(w.balance).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('Centralized Fixtures - Assets', () => {
  it('should contain 3 crypto assets', () => {
    expect(MOCK_CRYPTO_ASSETS).toHaveLength(3)
  })

  it('should have valid CryptoAsset shape', () => {
    for (const a of MOCK_CRYPTO_ASSETS) {
      expect(a).toHaveProperty('code')
      expect(a).toHaveProperty('name')
      expect(a).toHaveProperty('balance')
      expect(a).toHaveProperty('priceUsd')
      expect(a).toHaveProperty('color')
    }
  })

  it('should cover XLM, USDC, and USDT', () => {
    const codes = MOCK_CRYPTO_ASSETS.map((a) => a.code)
    expect(codes).toContain('XLM')
    expect(codes).toContain('USDC')
    expect(codes).toContain('USDT')
  })

  it('should have stablecoin pricing near $1', () => {
    const usdc = MOCK_CRYPTO_ASSETS.find((a) => a.code === 'USDC')
    const usdt = MOCK_CRYPTO_ASSETS.find((a) => a.code === 'USDT')
    expect(usdc?.priceUsd).toBeCloseTo(1.0, 1)
    expect(usdt?.priceUsd).toBeCloseTo(1.0, 1)
  })
})

describe('Centralized Fixtures - Contacts', () => {
  it('should contain 2 contacts', () => {
    expect(MOCK_CONTACTS).toHaveLength(2)
  })

  it('should have valid Contact shape', () => {
    for (const c of MOCK_CONTACTS) {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('name')
      expect(c).toHaveProperty('handle')
      expect(c).toHaveProperty('initials')
      expect(typeof c.id).toBe('string')
      expect(typeof c.name).toBe('string')
    }
  })
})

describe('Centralized Fixtures - Rates', () => {
  it('should have 6 entries in the conversion matrix', () => {
    const keys = Object.keys(MOCK_CONVERSION_RATES)
    expect(keys.length).toBeGreaterThanOrEqual(6)
  })

  it('should have identity rate (1:1) for same currency', () => {
    expect(MOCK_CONVERSION_RATES.XLM.XLM).toBe(1)
    expect(MOCK_CONVERSION_RATES.USDC.USDC).toBe(1)
    expect(MOCK_CONVERSION_RATES.USD.USD).toBe(1)
  })

  it('should have 6 simple rates', () => {
    expect(Object.keys(MOCK_SIMPLE_RATES)).toHaveLength(6)
  })

  it('should have a valid XLM USD rate', () => {
    expect(MOCK_XLM_USD_RATE).toBeGreaterThan(0)
    expect(MOCK_XLM_USD_RATE).toBeLessThan(1)
  })
})

describe('Centralized Fixtures - Stellar', () => {
  it('should have a valid test address', () => {
    expect(TEST_STELLAR_ADDRESS).toHaveLength(56)
    expect(TEST_STELLAR_ADDRESS).toMatch(/^G[A-Z0-9]{55}$/i)
  })

  it('should have a valid account', () => {
    expect(MOCK_STELLAR_ACCOUNT.publicKey).toBe(TEST_STELLAR_ADDRESS)
    expect(MOCK_STELLAR_ACCOUNT.isFunded).toBe(true)
    expect(MOCK_STELLAR_ACCOUNT.network).toBeTruthy()
  })
})

describe('Centralized Fixtures - Savings', () => {
  it('should contain 3 savings goals', () => {
    expect(MOCK_SAVINGS_GOALS).toHaveLength(3)
  })

  it('should have valid SavingsGoal shape', () => {
    for (const g of MOCK_SAVINGS_GOALS) {
      expect(g).toHaveProperty('id')
      expect(g).toHaveProperty('title')
      expect(g).toHaveProperty('saved')
      expect(g).toHaveProperty('target')
      expect(g).toHaveProperty('currency')
      expect(g).toHaveProperty('apy')
      expect(g).toHaveProperty('color')
      expect(g.saved).toBeLessThanOrEqual(g.target)
    }
  })
})

describe('Centralized Fixtures - Cards', () => {
  it('should contain 2 payment cards', () => {
    expect(MOCK_PAYMENT_CARDS).toHaveLength(2)
  })

  it('should have valid PaymentCard shape', () => {
    for (const c of MOCK_PAYMENT_CARDS) {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('label')
      expect(c).toHaveProperty('type')
      expect(c).toHaveProperty('brand')
      expect(c).toHaveProperty('last4')
      expect(c).toHaveProperty('expiry')
      expect(c).toHaveProperty('balance')
      expect(c).toHaveProperty('currency')
    }
  })

  it('should contain one physical and one virtual card', () => {
    const types = MOCK_PAYMENT_CARDS.map((c) => c.type)
    expect(types).toContain('physical')
    expect(types).toContain('virtual')
  })
})

describe('FixtureFactory - Index', () => {
  it('should re-export all items from index', () => {
    const factory = FixtureFactory
    expect(factory.getBalances()).toHaveLength(3)
    expect(factory.getTransactions()).toHaveLength(4)
    expect(factory.getWallets()).toHaveLength(3)
    expect(factory.getCryptoAssets()).toHaveLength(3)
    expect(factory.getContacts()).toHaveLength(2)
    expect(factory.getSavingsGoals()).toHaveLength(3)
    expect(factory.getPaymentCards()).toHaveLength(2)
    expect(factory.getStellarAccount().publicKey).toBe(TEST_STELLAR_ADDRESS)
  })

  it('should return immutable copies (not same references)', () => {
    const a = FixtureFactory.getBalances()
    const b = FixtureFactory.getBalances()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})
