/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET as transactionsGET } from '../../app/api/transactions/route'

jest.mock('../../lib/services/container', () => ({
  financeServices: {
    wallet: {
      getTransactionHistory: jest.fn().mockResolvedValue([
        {
          id: 't1',
          type: 'receive',
          amount: 100,
          asset: 'XLM',
          address: 'G...',
          date: 'Today',
          status: 'completed',
          category: 'transfer',
          currency: 'USD',
        },
        {
          id: 't2',
          type: 'send',
          amount: 50,
          asset: 'USDC',
          address: 'G...',
          date: 'Yesterday',
          status: 'completed',
          category: 'bills',
          currency: 'USD',
        },
      ]),
    },
  },
}))

describe('/api/transactions', () => {
  it('GET returns all transactions', async () => {
    const response = await transactionsGET(new NextRequest('http://localhost/api/transactions'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
  })

  it('GET filters by direction type', async () => {
    const response = await transactionsGET(
      new NextRequest('http://localhost/api/transactions?type=in'),
    )
    const data = await response.json()

    expect(data.data).toHaveLength(1)
    expect(data.data[0].type).toBe('receive')
  })

  it('GET filters by category and limit', async () => {
    const response = await transactionsGET(
      new NextRequest('http://localhost/api/transactions?category=bills&limit=1'),
    )
    const data = await response.json()

    expect(data.data).toHaveLength(1)
    expect(data.data[0].category).toBe('bills')
  })
})
