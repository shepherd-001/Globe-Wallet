import { NextRequest, NextResponse } from 'next/server'
import {
  AddTransactionRequest,
  AssetCode,
  TransactionCategory,
  TransactionDirection,
  TransactionPageResponse,
  TransactionSortField,
  TransactionSortOrder,
  TransactionsResponse,
} from '../../../lib/types'
import { db } from '../../../lib/db/mock-db'
import { transactionSyncService } from '../../../lib/services/transaction-sync.service'

export async function GET(request: NextRequest) {
  try {
    const sp = new URL(request.url).searchParams

    const type = sp.get('type') as TransactionDirection | null
    const category = sp.get('category') as TransactionCategory | null
    const asset = sp.get('asset') as AssetCode | null
    const status = sp.get('status') as 'completed' | 'pending' | 'failed' | null
    const search = sp.get('search') ?? undefined
    const from = sp.get('from') ?? undefined
    const to = sp.get('to') ?? undefined
    const sortBy = (sp.get('sortBy') ?? 'date') as TransactionSortField
    const sortOrder = (sp.get('sortOrder') ?? 'desc') as TransactionSortOrder
    const limitParam = sp.get('limit')
    const offsetParam = sp.get('offset')
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10))) : 20
    const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0
    const paginate = sp.get('paginate') !== 'false'

    if (paginate) {
      const page = await db.queryTransactions({
        type: type ?? undefined,
        category: category ?? undefined,
        asset: asset ?? undefined,
        status: status ?? undefined,
        search,
        from,
        to,
        sortBy,
        sortOrder,
        limit,
        offset,
      })
      return NextResponse.json<TransactionPageResponse>({ success: true, data: page })
    }

    const page = await db.queryTransactions({
      type: type ?? undefined,
      category: category ?? undefined,
      asset: asset ?? undefined,
      status: status ?? undefined,
      search,
      from,
      to,
      sortBy,
      sortOrder,
      limit,
      offset: 0,
    })
    return NextResponse.json<TransactionsResponse>({ success: true, data: page.data })
  } catch (error) {
    return NextResponse.json<TransactionsResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AddTransactionRequest = await request.json()

    if (!body.type || !body.amount || !body.asset || !body.address) {
      return NextResponse.json<TransactionsResponse>(
        { success: false, error: 'Missing required fields: type, amount, asset, address' },
        { status: 400 },
      )
    }
    if (body.amount <= 0 || !Number.isFinite(body.amount)) {
      return NextResponse.json<TransactionsResponse>(
        { success: false, error: 'amount must be a positive number' },
        { status: 400 },
      )
    }

    const tx = await transactionSyncService.addTransaction(body)
    return NextResponse.json<TransactionsResponse>({ success: true, data: [tx] }, { status: 201 })
  } catch (error) {
    return NextResponse.json<TransactionsResponse>(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
