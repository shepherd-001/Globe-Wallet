"use client"

import { SendConfirmation } from "@/lib/types"
import { Separator } from "@/components/ui/separator"

interface SendSummaryProps {
  confirmation: SendConfirmation
}

export function SendSummary({ confirmation }: SendSummaryProps) {
  const {
    recipient,
    recipientLabel,
    amount,
    asset,
    memo,
    estimatedFee,
    federatedInput,
    federationMemo,
  } = confirmation

  const recipientDisplay =
    recipientLabel ??
    (federatedInput
      ? `${federatedInput} → ${recipient.slice(0, 8)}…${recipient.slice(-6)}`
      : `${recipient.slice(0, 8)}…${recipient.slice(-6)}`)

  return (
    <div
      data-testid="send-summary"
      aria-label="Send confirmation summary"
      className="space-y-2 rounded-md border border-primary/20 bg-muted/30 p-3 text-sm"
    >
      <Row label="To" value={recipientDisplay} testId="summary-recipient" />
      {federatedInput && (
        <Row
          label="Address"
          value={`${recipient.slice(0, 8)}…${recipient.slice(-6)}`}
          testId="summary-resolved-address"
        />
      )}
      <Separator />
      <Row label="Amount" value={`${amount} ${asset}`} testId="summary-amount" />
      <Row label="Network fee" value={`${estimatedFee} XLM`} testId="summary-fee" />
      {(memo || federationMemo) && (
        <Row
          label="Memo"
          value={memo ?? federationMemo ?? ""}
          testId="summary-memo"
        />
      )}
      <Separator />
      <Row
        label="Total deducted"
        value={`${asset === "XLM" ? amount + estimatedFee : amount} ${asset} + ${estimatedFee} XLM fee`}
        testId="summary-total"
      />
    </div>
  )
}

function Row({
  label,
  value,
  testId,
}: {
  label: string
  value: string
  testId?: string
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium font-mono break-all text-right max-w-[60%]" data-testid={testId}>
        {value}
      </span>
    </div>
  )
}
