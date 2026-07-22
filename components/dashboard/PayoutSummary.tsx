"use client";

import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PayoutBreakdown } from "@/lib/off-ramp-utils";
import { formatUSD, describeFee } from "@/lib/off-ramp-utils";
import type { OffRampPaymentMethod } from "@/lib/off-ramp-utils";

interface PayoutSummaryProps {
  breakdown: PayoutBreakdown;
  method: OffRampPaymentMethod;
  "data-testid"?: string;
}

/**
 * Transaction summary card for the off-ramp page.
 * Displays crypto amount, USD value, fees, and net payout.
 * Issue #21: Extracted into a standalone testable component.
 */
export function PayoutSummary({
  breakdown,
  method,
  "data-testid": testId = "payout-summary",
}: PayoutSummaryProps) {
  const { cryptoAmount, asset, usdValue, feeAmount, netPayout } = breakdown;
  const feeDescription = describeFee(method.fees, usdValue);

  return (
    <Card className="p-4" data-testid={testId}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium" aria-label="Transaction Summary header">
          <Info className="h-4 w-4" aria-hidden="true" />
          Transaction Summary
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Withdraw Amount</dt>
            <dd>
              {cryptoAmount} {asset}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">USD Value</dt>
            <dd aria-label={`USD value: ${formatUSD(usdValue)}`}>{formatUSD(usdValue)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground" title={feeDescription}>
              Processing Fee
            </dt>
            <dd aria-label={`Fee: ${formatUSD(feeAmount)}`}>-{formatUSD(feeAmount)}</dd>
          </div>
          <div className="border-t pt-1 mt-2 flex justify-between font-medium">
            <dt>You&apos;ll receive</dt>
            <dd aria-label={`Net payout: ${formatUSD(netPayout)}`}>{formatUSD(netPayout)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
