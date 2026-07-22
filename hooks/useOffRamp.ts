"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  buildPayoutBreakdown,
  validateWithdrawal,
  DEFAULT_RATES,
  DEFAULT_BALANCES,
  type OffRampPaymentMethod,
  type PayoutBreakdown,
} from "@/lib/off-ramp-utils";
import type { WithdrawalValidationResult, PersistedWithdrawal } from "@/lib/types";

const STORAGE_METHOD_KEY = "globe-offramp-selected-method";
const STORAGE_WITHDRAWAL_KEY = "globe-offramp-last-withdrawal";

export interface UseOffRampOptions {
  methods?: OffRampPaymentMethod[];
  rates?: Record<string, number>;
  balances?: Record<string, number>;
}

export interface UseOffRampReturn {
  // form state
  amount: string;
  asset: string;
  paymentMethodId: string;
  isLoading: boolean;
  backendError: string | null;
  lastWithdrawal: PersistedWithdrawal | null;

  // computed
  breakdown: PayoutBreakdown | null;
  validation: WithdrawalValidationResult;

  // actions
  setAmount: (v: string) => void;
  setAsset: (v: string) => void;
  setPaymentMethod: (id: string) => void;
  setMaxAmount: () => void;
  submit: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_METHODS: OffRampPaymentMethod[] = [
  {
    id: "bank_1",
    type: "bank",
    name: "Chase Checking ****1234",
    details: "ACH Transfer",
    fees: "1.5%",
    processingTime: "1-3 business days",
    limits: { min: 10, max: 10000 },
    enabled: true,
  },
  {
    id: "bank_2",
    type: "bank",
    name: "Wells Fargo Savings ****5678",
    details: "Wire Transfer",
    fees: "$15 + 1%",
    processingTime: "Same day",
    limits: { min: 100, max: 50000 },
    enabled: true,
  },
  {
    id: "card_1",
    type: "card",
    name: "Visa Debit ****9012",
    details: "Instant Transfer",
    fees: "2.5%",
    processingTime: "Instant",
    limits: { min: 5, max: 1000 },
    enabled: false,
  },
];

export function useOffRamp({
  methods = DEFAULT_METHODS,
  rates = DEFAULT_RATES,
  balances = DEFAULT_BALANCES,
}: UseOffRampOptions = {}): UseOffRampReturn {
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("XLM");
  const [paymentMethodId, setPaymentMethodIdState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [lastWithdrawal, setLastWithdrawal] = useState<PersistedWithdrawal | null>(null);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedMethod = window.localStorage.getItem(STORAGE_METHOD_KEY);
    const storedWithdrawal = window.localStorage.getItem(STORAGE_WITHDRAWAL_KEY);
    if (storedMethod) setPaymentMethodIdState(storedMethod);
    if (storedWithdrawal) {
      try {
        setLastWithdrawal(JSON.parse(storedWithdrawal) as PersistedWithdrawal);
      } catch {
        window.localStorage.removeItem(STORAGE_WITHDRAWAL_KEY);
      }
    }
  }, []);

  const setPaymentMethod = useCallback((id: string) => {
    setPaymentMethodIdState(id);
    window.localStorage.setItem(STORAGE_METHOD_KEY, id);
  }, []);

  const setMaxAmount = useCallback(() => {
    const bal = balances[asset];
    if (bal != null) setAmount(String(bal));
  }, [balances, asset]);

  const clearError = useCallback(() => setBackendError(null), []);

  // Live validation
  const validation = useMemo<WithdrawalValidationResult>(() =>
    validateWithdrawal({
      amount,
      asset,
      paymentMethodId,
      balances,
      rates,
      methods,
    }),
  [amount, asset, paymentMethodId, balances, rates, methods]);

  // Live payout breakdown
  const breakdown = useMemo<PayoutBreakdown | null>(() => {
    const num = parseFloat(amount);
    if (!Number.isFinite(num) || num <= 0 || !paymentMethodId) return null;
    return buildPayoutBreakdown(num, asset, paymentMethodId, methods, rates);
  }, [amount, asset, paymentMethodId, methods, rates]);

  const submit = useCallback(async () => {
    if (!validation.valid) return;

    setBackendError(null);
    setIsLoading(true);

    try {
      const numericAmount = parseFloat(amount);
      const fiatAmount = breakdown?.usdValue ?? 0;

      const response = await fetch("/api/off-ramp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset,
          amount: numericAmount,
          paymentMethodId,
          fiatAmount,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: {
          methodId: string;
          methodName: string;
          asset: string;
          amount: number;
          fiatAmount: number;
          status?: "completed" | "pending" | "failed";
          hash?: string;
        };
        error?: string;
      };

      if (!response.ok || !data.success) {
        const msg = data?.error ?? "Unable to process withdrawal";
        setBackendError(msg);
        return;
      }

      const result = data.data!;
      const saved: PersistedWithdrawal = {
        methodId: result.methodId,
        methodName: result.methodName,
        asset: result.asset,
        amount: result.amount,
        fiatAmount: result.fiatAmount,
        status: result.status ?? "pending",
        hash: result.hash,
        date: new Date().toISOString(),
      };
      window.localStorage.setItem(STORAGE_WITHDRAWAL_KEY, JSON.stringify(saved));
      setLastWithdrawal(saved);
      setAmount("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to process withdrawal";
      setBackendError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [validation, amount, asset, paymentMethodId, breakdown]);

  return {
    amount,
    asset,
    paymentMethodId,
    isLoading,
    backendError,
    lastWithdrawal,
    breakdown,
    validation,
    setAmount,
    setAsset,
    setPaymentMethod,
    setMaxAmount,
    submit,
    clearError,
  };
}
