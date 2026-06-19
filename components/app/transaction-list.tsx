"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Smartphone,
  ReceiptText,
  PiggyBank,
  CreditCard,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const categoryIcon: Record<string, LucideIcon> = {
  transfer: ArrowUpRight,
  airtime: Smartphone,
  bills: ReceiptText,
  savings: PiggyBank,
  card: CreditCard,
  deposit: Banknote,
  payment: ArrowUpRight,
  exchange: ArrowUpRight,
  withdrawal: ArrowUpRight,
};

interface TransactionListProps {
  limit?: number;
}

export function TransactionList({ limit }: TransactionListProps) {
  const { getTransactions, loading } = useTransactions();
  const [items, setItems] = useState<Transaction[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getTransactions();
        if (!cancelled) {
          setItems(limit ? data.slice(0, limit) : data);
        }
      } catch {
        if (!cancelled) setItems([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [getTransactions, limit]);

  if (loading && items.length === 0) {
    return (
      <ul
        className="divide-y divide-border"
        data-testid="transaction-list-loading"
        aria-busy="true"
      >
        {Array.from({ length: limit ?? 3 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
          </li>
        ))}
      </ul>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <p
        className="py-8 text-center text-sm text-muted-foreground"
        data-testid="transaction-list-empty"
        role="status"
        aria-live="polite"
      >
        No transactions yet
      </p>
    );
  }

  return (
    <ul
      className="divide-y divide-border"
      role="list"
      data-testid="transaction-list"
    >
      {items.map((tx) => {
        const isIncoming =
          (tx.type as string) === "in" ||
          (tx.type as string) === "receive" ||
          (tx.type as string) === "deposit";
        const Icon = isIncoming
          ? ArrowDownLeft
          : (tx.category ? categoryIcon[tx.category] : ArrowUpRight) ||
            ArrowUpRight;

        return (
          <li
            key={tx.id}
            className="flex items-center gap-3 py-3"
            role="listitem"
            data-testid={`transaction-${tx.id}`}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isIncoming
                  ? "bg-primary/15 text-primary"
                  : "bg-secondary text-muted-foreground",
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {tx.name || "Transaction"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {tx.detail || tx.address || ""}
              </p>
            </div>
            <div className="text-right">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isIncoming ? "text-primary" : "text-foreground",
                )}
              >
                {isIncoming ? "+" : "-"}
                {tx.amount} {tx.asset}
              </p>
              <p className="text-[11px] text-muted-foreground">{tx.date}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
