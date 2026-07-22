/**
 * lib/services/federation.service.ts — Issue #11
 * Implements the Stellar Federation Protocol (SEP-0002) for resolving
 * human-readable addresses (user*domain.tld) to Stellar public keys.
 *
 * In production this would fetch the domain's stellar.toml to find the
 * FEDERATION_SERVER URL, then call GET /federation?q=...&type=name.
 * Here we use a mock registry that is injected for tests and used by
 * the /api/federation route in development/CI.
 *
 * Security note: No private keys or secrets pass through this service.
 * Always validate the returned account_id with isValidStellarAddress()
 * before using it in a transaction.
 */

import type { AddressLookupResult, IFederationService } from '../types'
import { isFederatedAddress } from '../helpers/send-utils'
import { isValidStellarAddress } from '../helpers/format'

export interface FederationRecord {
  account_id: string
  memo?: string
  memo_type?: 'text' | 'id' | 'hash'
}

/** Mock registry keyed by the full federated address string. */
export const MOCK_FEDERATION_REGISTRY: Record<string, FederationRecord> = {
  'alice*stellar.org': {
    account_id: 'GDXSPAYWALLET7QK3MUKXHV2RZ4D6FJ5N2YHV3K2L9P8QW1ZC4T6BNRX',
  },
  'test*globe.wallet': {
    account_id: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
    memo: 'GLOBE-TEST',
    memo_type: 'text',
  },
}

export class FederationService implements IFederationService {
  private readonly registry: Record<string, FederationRecord>

  constructor(registry: Record<string, FederationRecord> = MOCK_FEDERATION_REGISTRY) {
    this.registry = registry
  }

  isFederated(input: string): boolean {
    return isFederatedAddress(input)
  }

  async lookup(federatedAddress: string): Promise<AddressLookupResult> {
    const input = federatedAddress.trim().toLowerCase()

    if (!this.isFederated(input)) {
      return { status: 'error', input, error: 'Not a federated address.' }
    }

    const record = this.registry[input]

    if (!record) {
      return { status: 'not-found', input }
    }

    if (!isValidStellarAddress(record.account_id)) {
      return {
        status: 'error',
        input,
        error: 'Federation record contains an invalid Stellar address.',
      }
    }

    return {
      status: 'resolved',
      input,
      resolved: record.account_id,
      federationMemo: record.memo,
    }
  }
}

export const federationService = new FederationService()
