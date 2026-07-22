import { NextResponse } from 'next/server'
import { FixtureFactory } from '@/lib/fixtures'

export async function GET() {
  return NextResponse.json(FixtureFactory.getTransactions(), { status: 200 })
}
