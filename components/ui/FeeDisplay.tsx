"use client";

import { Info } from "lucide-react";
import { parseFeeString, formatFeePercent, formatUSD } from "@/lib/off-ramp-utils";

interface FeeDisplayProps {
  /** Raw fee string from the payment method, e.g. "1.5%" or "$15 + 1%" */
  feeStr: string;
  /** USD value to compute the variable component against */
  usdValue?: number;
  /** Show both components of a mixed fee */
  showBreakdown?: boolean;
  className?: string;
}

/**
 * Renders a human-readable fee badge.
 * Shows an info tooltip on hover for complex (mixed) fees.
 * Issue #21: Accessible, testable UI primitive.
 */
export function FeeDisplay({
  feeStr,
  usdValue = 0,
  showBreakdown = false,
  className = "",
}: FeeDisplayProps) {
  const { fixedFee, percentFee } = parseFeeString(feeStr);
  const isMixed = fixedFee > 0 && percentFee > 0;
  const variableAmount = usdValue * percentFee;
  const totalFee = fixedFee + variableAmount;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${className}`}
      aria-label={`Fee: ${feeStr}`}
      data-testid="fee-display"
    >
      <span className="font-medium">{feeStr}</span>

      {isMixed && usdValue > 0 && (
        <span
          className="text-muted-foreground"
          aria-label={`Total fee at this amount: ${formatUSD(totalFee)}`}
        >
          ({formatUSD(totalFee)})
        </span>
      )}

      {isMixed && (
        <span
          title={`${formatUSD(fixedFee)} flat + ${formatFeePercent(percentFee)} of amount`}
          aria-label="Fee structure info"
        >
          <Info className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </span>
      )}

      {showBreakdown && isMixed && usdValue > 0 && (
        <span className="sr-only">
          {formatUSD(fixedFee)} fixed plus {formatFeePercent(percentFee)} equals{" "}
          {formatUSD(totalFee)} total
        </span>
      )}
    </span>
  );
}
