import { Horizon } from '@stellar/stellar-sdk'
async function run() {
  const server = new Horizon.Server('https://horizon-testnet.stellar.org')
  try {
    const res = await server.transactions().transaction('0000000000000000000000000000000000000000000000000000000000000000')
    console.log("Resolved:", Object.keys(res))
  } catch (e: any) {
    console.log("Error status:", e.response?.status)
  }
}
run().catch(e => console.log('Top level catch:', e))
