/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { GET, POST } from '../../app/api/receive/route'
import { TEST_STELLAR_ADDRESS } from '../../lib/finance-data'

describe('/api/receive — issue #22', () => {
  it('GET returns wallet receive address', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.address).toBe(TEST_STELLAR_ADDRESS)
  })

  it('POST creates payment request with QR value', async () => {
    const request = new NextRequest('http://localhost/api/receive', {
      method: 'POST',
      body: JSON.stringify({ amount: '20', memo: 'API' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.qrValue).toContain('amount=20')
    expect(data.qrValue).toContain('memo=API')
    expect(data.shareText).toContain('20 XLM')
  })

  it('POST returns validation error for invalid amount', async () => {
    const request = new NextRequest('http://localhost/api/receive', {
      method: 'POST',
      body: JSON.stringify({ amount: 'not-a-number' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.success).toBe(false)
    expect(data.error).toMatch(/valid amount/i)
  })

  it('POST rejects negative amounts', async () => {
    const request = new NextRequest('http://localhost/api/receive', {
      method: 'POST',
      body: JSON.stringify({ amount: '-5' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.success).toBe(false)
  })
})
