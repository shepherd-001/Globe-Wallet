'use client'

import { useState, useEffect, useRef } from 'react'
import type { AddressLookupResult } from '../lib/types'
import { isFederatedAddress } from '../lib/helpers/send-utils'

const DEBOUNCE_MS = 400

/**
 * useAddressLookup — Issue #11
 *
 * Watches an address input string. When it looks like a Stellar federated
 * address (`user*domain.tld`), it calls GET /api/federation?q=... to resolve
 * the public key. Otherwise it returns { status: 'idle' }.
 *
 * Debounces the network call by DEBOUNCE_MS to avoid hammering the API on
 * every keystroke. Any in-flight request is cancelled when the input changes.
 */
export function useAddressLookup(input: string): AddressLookupResult {
  const [result, setResult] = useState<AddressLookupResult>({ status: 'idle', input: '' })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const trimmed = input.trim()

    if (!isFederatedAddress(trimmed)) {
      setResult({ status: 'idle', input: trimmed })
      return
    }

    // Signal resolving immediately so the UI can show a spinner
    setResult({ status: 'resolving', input: trimmed })

    const timer = setTimeout(async () => {
      // Cancel any previous in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const res = await fetch(
          `/api/federation?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        )

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setResult({
            status: res.status === 404 ? 'not-found' : 'error',
            input: trimmed,
            error: body?.error ?? 'Federation lookup failed.',
          })
          return
        }

        const data = await res.json()

        if (!data?.account_id) {
          setResult({ status: 'not-found', input: trimmed })
          return
        }

        setResult({
          status: 'resolved',
          input: trimmed,
          resolved: data.account_id,
          federationMemo: data.memo ?? undefined,
        })
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setResult({
          status: 'error',
          input: trimmed,
          error: err instanceof Error ? err.message : 'Address lookup failed.',
        })
      }
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [input])

  return result
}
