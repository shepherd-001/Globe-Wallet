/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET as assetsGET, POST as assetsPOST } from '../../app/api/assets/route'
import { GET as walletsGET, POST as walletsPOST } from '../../app/api/wallets/route'
import { GET as stellarGET, POST as stellarPOST } from '../../app/api/stellar/route'

// Mock the finance services
jest.mock('../../lib/services/container', () => ({
  financeServices: {
    asset: {
      getAssets: jest.fn().mockReturnValue([
        { code: 'XLM', name: 'Stellar Lumens', balance: 1000, priceUsd: 0.10 }
      ]),
      getAssetPrice: jest.fn().mockResolvedValue(0.10)
    },
    pricing: {
      getAssets: jest.fn().mockReturnValue([
        { code: 'XLM', name: 'Stellar Lumens', balance: 1000, priceUsd: 0.10 }
      ]),
      getPrice: jest.fn().mockResolvedValue(0.10),
      formatAsset: jest.fn(),
    },
    fiat: {
      getWallets: jest.fn().mockReturnValue([
        { code: 'USD', label: 'US Dollar', symbol: '$', balance: 1000 }
      ]),
      convertCurrency: jest.fn().mockReturnValue(1580.5),
      getExchangeRate: jest.fn().mockReturnValue(1580.5)
    },
    stellar: {
      getAccountInfo: jest.fn().mockReturnValue({
        publicKey: 'GDXS...BNRX',
        memo: 'STLP-2048',
        network: 'Stellar Public Network'
      }),
      getOffRampMethods: jest.fn().mockReturnValue([]),
      validateAddress: jest.fn().mockReturnValue(true),
      generateReceiveAddress: jest.fn().mockReturnValue('GDXS...BNRX'),
      getOffRampRate: jest.fn().mockReturnValue(1580.5)
    }
  }
}))

describe('API Routes Integration', () => {
  describe('/api/assets', () => {
    it('GET should return assets list', async () => {
      const response = await assetsGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data[0]).toHaveProperty('code')
    })

    it('POST should return asset price', async () => {
      const request = new NextRequest('http://localhost/api/assets', {
        method: 'POST',
        body: JSON.stringify({ assetCode: 'XLM' })
      })

      const response = await assetsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('assetCode', 'XLM')
      expect(data.data).toHaveProperty('price', 0.10)
    })

    it('POST should handle invalid asset code', async () => {
      const request = new NextRequest('http://localhost/api/assets', {
        method: 'POST',
        body: JSON.stringify({ assetCode: 'INVALID' })
      })

      const response = await assetsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('/api/wallets', () => {
    it('GET should return wallets list', async () => {
      const response = await walletsGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('POST should return currency conversion', async () => {
      const request = new NextRequest('http://localhost/api/wallets', {
        method: 'POST',
        body: JSON.stringify({ from: 'USD', to: 'NGN', amount: 100 })
      })

      const response = await walletsPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('convertedAmount')
      expect(data.data).toHaveProperty('rate')
    })
  })

  describe('/api/stellar', () => {
    it('GET should return account info and off-ramp methods', async () => {
      const response = await stellarGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('account')
      expect(data.data).toHaveProperty('offRampMethods')
    })

    it('POST should validate address', async () => {
      const request = new NextRequest('http://localhost/api/stellar', {
        method: 'POST',
        body: JSON.stringify({
          action: 'validateAddress',
          data: { address: 'GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX' }
        })
      })

      const response = await stellarPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('isValid', true)
    })

    it('POST should handle invalid action', async () => {
      const request = new NextRequest('http://localhost/api/stellar', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalidAction',
          data: {}
        })
      })

      const response = await stellarPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})