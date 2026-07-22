"use client"

import { ReceiveQRData } from "@/lib/types"
import { Separator } from "@/components/ui/separator"

interface ReceiveSummaryProps {
  qrData: ReceiveQRData
}

export function ReceiveSummary({ qrData }: ReceiveSummaryProps) {
  const { amount, memo } = qrData

  if (!amount && !memo) {
    return null
  }

  return (
    <div
      data-testid="receive-summary"
      aria-label="Payment request summary"
      className="space-y-2 rounded-lg bg-secondary p-3 text-left text-sm"
    >
      {amount && (
        <>
          <Row label="Amount" value={`${amount} XLM`} testId="summary-amount" />
          {memo && <Separator />}
        </>
      )}
      {memo && <Row label="Memo" value={memo} testId="summary-memo" />}
    </div>
  )
}

function Row({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium" data-testid={testId}>
        {value}
      </span>
    </div>
  )
}
