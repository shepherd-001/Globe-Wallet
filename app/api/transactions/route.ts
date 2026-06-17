import { NextRequest, NextResponse } from 'next/server'
import { financeServices } from '../../../lib/services/container'
import {
  TransactionCategory,
  TransactionDirection,
  TransactionsResponse,
} from '../../../lib/types'
import { matchesCategoryFilter, matchesDirectionFilter } from '../../../lib/transaction-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as TransactionDirection | null
    const category = searchParams.get('category') as TransactionCategory | null
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : undefined

    let transactions = await financeServices.wallet.getTransactionHistory()

    if (type) {
      transactions = transactions.filter((tx) => matchesDirectionFilter(tx, type))
    }
    if (category) {
      transactions = transactions.filter((tx) => matchesCategoryFilter(tx, category))
    }
    if (limit && limit > 0) {
      transactions = transactions.slice(0, limit)
    }

    return NextResponse.json<TransactionsResponse>({
      success: true,
      data: transactions,
    })
  } catch (error) {
    return NextResponse.json<TransactionsResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}
