import { transactionSyncService } from './lib/services/transaction-sync.service'
import { db } from './lib/db/mock-db'

async function run() {
  console.log('Adding pending transaction with fake hash...')
  const fakeHash = '0000000000000000000000000000000000000000000000000000000000000000'
  await transactionSyncService.addTransaction({
    type: 'receive',
    amount: 10,
    asset: 'XLM',
    address: 'G1',
    stellarHash: fakeHash,
  })

  console.log('Adding pending transaction with failed testnet hash...')
  const failedHash = '798b554f9f4176f55791c79da2706f6a3327f211be8670c08f41868826a5292b'
  await transactionSyncService.addTransaction({
    type: 'send',
    amount: 10,
    asset: 'XLM',
    address: 'G2',
    stellarHash: failedHash,
  })

  console.log('Adding pending transaction with success testnet hash...')
  const successHash = 'b9d0b2292c4e09e8eb22d036171491e87b8d2086bf8b265874c8d182cb9c9020'
  await transactionSyncService.addTransaction({
    type: 'send',
    amount: 10,
    asset: 'XLM',
    address: 'G3',
    stellarHash: successHash,
  })

  console.log('Syncing from real Testnet Horizon...')
  const result = await transactionSyncService.syncFromNetwork()
  console.log('Sync result:', result)

  const allTxs = await db.getTransactions()
  console.log('Final Transaction Statuses:')
  for (const tx of allTxs) {
    if ([fakeHash, failedHash, successHash].includes(tx.stellarHash!)) {
      console.log(`Hash: ${tx.stellarHash?.substring(0, 8)}... Status: ${tx.status}`)
    }
  }
}

run().catch(console.error)
