import { NextResponse } from 'next/server'
import { FixtureFactory } from '@/lib/fixtures'

export async function GET() {
  const rates = FixtureFactory.getSimpleRates()
  return NextResponse.json(
    {
      rates,
      updatedAt: new Date().toISOString(),
    },
    { status: 200 },
  )
}
