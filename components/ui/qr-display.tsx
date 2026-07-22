"use client"

import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"

interface QRDisplayProps {
  value: string
  label: string
  size?: number
  testId?: string
  className?: string
}

export function QRDisplay({
  value,
  label,
  size = 160,
  testId = "qr-code",
  className,
}: QRDisplayProps) {
  return (
    <div
      className={cn("flex justify-center", className)}
      data-testid={`${testId}-container`}
    >
      <div
        className="rounded-2xl bg-white p-4"
        role="img"
        aria-label={label}
        data-testid={testId}
        data-value={value}
      >
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          includeMargin={false}
        />
      </div>
    </div>
  )
}
