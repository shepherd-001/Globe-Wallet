import { FixtureFactory } from '../../../lib/fixtures/factory'
import { TEST_STELLAR_ADDRESS } from '../../../lib/fixtures/stellar'

describe('FixtureFactory', () => {
  beforeEach(() => {
    FixtureFactory.resetCounter()
  })

  describe('getBalances', () => {
    it('should return 3 balances', () => {
      expect(FixtureFactory.getBalances()).toHaveLength(3)
    })

    it('should return fresh copies each call', () => {
      const a = FixtureFactory.getBalances()
      const b = FixtureFactory.getBalances()
      expect(a).not.toBe(b)
      expect(a).toEqual(b)
      a[0].amount = 99999
      expect(b[0].amount).toBe(4250.5)
    })
  })

  describe('getTransactions', () => {
    it('should return 4 transactions', () => {
      expect(FixtureFactory.getTransactions()).toHaveLength(4)
    })
  })

  describe('getWallets', () => {
    it('should return 3 wallets', () => {
      expect(FixtureFactory.getWallets()).toHaveLength(3)
    })
  })

  describe('getCryptoAssets', () => {
    it('should return 3 assets', () => {
      const assets = FixtureFactory.getCryptoAssets()
      expect(assets).toHaveLength(3)
      expect(assets.map((a) => a.code)).toEqual(['XLM', 'USDC', 'USDT'])
    })
  })

  describe('getStellarAccount', () => {
    it('should return the test account', () => {
      const account = FixtureFactory.getStellarAccount()
      expect(account.publicKey).toBe(TEST_STELLAR_ADDRESS)
      expect(account.isFunded).toBe(true)
    })
  })

  describe('getTestStellarAddress', () => {
    it('should return the canonical test address', () => {
      expect(FixtureFactory.getTestStellarAddress()).toBe(TEST_STELLAR_ADDRESS)
    })
  })

  describe('getXlmUsdRate', () => {
    it('should return the mock rate', () => {
      expect(FixtureFactory.getXlmUsdRate()).toBe(0.1185)
    })
  })

  describe('createBalance', () => {
    it('should create a balance with defaults', () => {
      const b = FixtureFactory.createBalance()
      expect(b).toHaveProperty('asset')
      expect(b).toHaveProperty('amount')
      expect(b).toHaveProperty('priceUsd')
      expect(typeof b.amount).toBe('number')
      expect(b.amount).toBeGreaterThan(0)
    })

    it('should respect overrides', () => {
      const b = FixtureFactory.createBalance({ asset: 'USDC', amount: 500, priceUsd: 1.0 })
      expect(b.asset).toBe('USDC')
      expect(b.amount).toBe(500)
      expect(b.priceUsd).toBe(1.0)
    })
  })

  describe('createTransaction', () => {
    it('should create a transaction with defaults', () => {
      const tx = FixtureFactory.createTransaction()
      expect(tx).toHaveProperty('id')
      expect(tx).toHaveProperty('type')
      expect(tx).toHaveProperty('amount')
      expect(tx).toHaveProperty('asset')
      expect(tx).toHaveProperty('address')
      expect(tx).toHaveProperty('status')
      expect(tx.id).toMatch(/^tx-\d+$/)
    })

    it('should respect overrides', () => {
      const tx = FixtureFactory.createTransaction({
        id: 'custom-id',
        type: 'receive',
        amount: 100,
        asset: 'XLM',
        status: 'pending',
        category: 'deposit',
      })
      expect(tx.id).toBe('custom-id')
      expect(tx.type).toBe('receive')
      expect(tx.amount).toBe(100)
      expect(tx.status).toBe('pending')
      expect(tx.category).toBe('deposit')
    })

    it('should generate unique IDs', () => {
      const a = FixtureFactory.createTransaction()
      const b = FixtureFactory.createTransaction()
      expect(a.id).not.toBe(b.id)
    })

    it('should generate a stellar hash', () => {
      const tx = FixtureFactory.createTransaction()
      expect(tx.stellarHash).toMatch(/^0x[a-f0-9]+$/)
    })
  })

  describe('createWallet', () => {
    it('should create a wallet with defaults', () => {
      const w = FixtureFactory.createWallet()
      expect(w).toHaveProperty('id')
      expect(w).toHaveProperty('code')
      expect(w).toHaveProperty('name')
      expect(w).toHaveProperty('balance')
      expect(w).toHaveProperty('color')
    })

    it('should accept overrides', () => {
      const w = FixtureFactory.createWallet({ code: 'NGN', balance: 50000, color: 'bg-red-500' })
      expect(w.code).toBe('NGN')
      expect(w.balance).toBe(50000)
      expect(w.color).toBe('bg-red-500')
    })
  })

  describe('createContact', () => {
    it('should create a contact with defaults', () => {
      const c = FixtureFactory.createContact()
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('name')
      expect(c).toHaveProperty('handle')
      expect(c).toHaveProperty('initials')
    })

    it('should derive handle from name', () => {
      const c = FixtureFactory.createContact({ name: 'Jane Doe' })
      expect(c.handle).toBe('@janedoe')
      expect(c.initials).toBe('JA')
    })
  })

  describe('createSavingsGoal', () => {
    it('should create a savings goal with defaults', () => {
      const g = FixtureFactory.createSavingsGoal()
      expect(g).toHaveProperty('id')
      expect(g).toHaveProperty('title')
      expect(g).toHaveProperty('target')
      expect(g.target).toBeGreaterThan(0)
    })

    it('should accept overrides', () => {
      const g = FixtureFactory.createSavingsGoal({ target: 5000, saved: 2000, currency: 'USD', apy: 10 })
      expect(g.target).toBe(5000)
      expect(g.saved).toBe(2000)
      expect(g.currency).toBe('USD')
      expect(g.apy).toBe(10)
    })
  })

  describe('createPaymentCard', () => {
    it('should create a payment card with defaults', () => {
      const c = FixtureFactory.createPaymentCard()
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('label')
      expect(c.type).toBe('virtual')
      expect(c.brand).toBe('Visa')
    })

    it('should accept overrides', () => {
      const c = FixtureFactory.createPaymentCard({ type: 'physical', brand: 'Mastercard', frozen: true })
      expect(c.type).toBe('physical')
      expect(c.brand).toBe('Mastercard')
      expect(c.frozen).toBe(true)
    })
  })

  describe('createPortfolio', () => {
    it('should create a complete portfolio', () => {
      const p = FixtureFactory.createPortfolio()
      expect(p.wallets).toHaveLength(3)
      expect(p.cryptoAssets).toHaveLength(3)
      expect(p.balances).toHaveLength(3)
      expect(p.transactions).toHaveLength(4)
      expect(p.contacts).toHaveLength(2)
      expect(p.savingsGoals).toHaveLength(3)
      expect(p.paymentCards).toHaveLength(2)
      expect(p.rates).toHaveProperty('XLM_USD')
      expect(p.stellarAccount.publicKey).toBe(TEST_STELLAR_ADDRESS)
    })
  })

  describe('resetCounter', () => {
    it('should reset counter to produce predictable IDs', () => {
      FixtureFactory.createTransaction()
      FixtureFactory.createTransaction()
      FixtureFactory.resetCounter()
      const tx = FixtureFactory.createTransaction()
      expect(tx.id).toBe('tx-1')
    })
  })

  describe('Edge cases', () => {
    it('createBalance with zero amount', () => {
      const b = FixtureFactory.createBalance({ amount: 0, priceUsd: 0 })
      expect(b.amount).toBe(0)
      expect(b.priceUsd).toBe(0)
    })

    it('createTransaction with invalid status override', () => {
      const tx = FixtureFactory.createTransaction({ status: 'failed' as any })
      expect(tx.status).toBe('failed')
    })

    it('createSavingsGoal with saved > target', () => {
      const g = FixtureFactory.createSavingsGoal({ saved: 2000, target: 1000 })
      expect(g.saved).toBe(2000)
      expect(g.target).toBe(1000)
    })
  })
})
