"use client"

import { Copy, Share, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QRDisplay } from "@/components/ui/qr-display"
import { ReceiveSummary } from "@/components/dashboard/receive-summary"
import { useReceive } from "@/hooks/useReceive"
import { toast } from "sonner"

async function copyText(text: string, label: string) {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      throw new Error("Clipboard API is unavailable")
    }
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  } catch {
    toast.error(`Couldn't copy ${label.toLowerCase()}. Please copy it manually.`)
  }
}

async function shareText(title: string, text: string, fallbackLabel: string) {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text })
      return
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return
      }
    }
  }
  await copyText(text, fallbackLabel)
}

export function ReceiveForm() {
  const {
    address,
    hasAccount,
    amount,
    memo,
    amountError,
    addressQR,
    paymentQR,
    setAmount,
    setMemo,
    getShareText,
  } = useReceive()

  if (!hasAccount) {
    return (
      <Card className="p-6" data-testid="receive-no-account">
        <p className="py-10 text-center text-sm text-muted-foreground">
          No Stellar account is available yet. Connect or create a wallet to receive XLM.
        </p>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="address" className="w-full" data-testid="receive-tabs">
      <TabsList className="grid w-full grid-cols-2" aria-label="Receive options">
        <TabsTrigger value="address" data-testid="tab-address">
          Address
        </TabsTrigger>
        <TabsTrigger value="request" data-testid="tab-request">
          Request
        </TabsTrigger>
      </TabsList>

      <TabsContent value="address" className="space-y-4">
        <Card className="p-6" data-testid="receive-address-card">
          <div className="space-y-4 text-center">
            <QRDisplay
              value={addressQR.value}
              label="QR code for Stellar receive address"
              testId="address-qr"
            />

            <div className="space-y-2">
              <Label
                htmlFor="receive-address-display"
                className="text-sm font-medium text-muted-foreground"
              >
                Your Stellar Address
              </Label>
              <div className="flex items-center gap-2 rounded-lg bg-secondary p-3">
                <code
                  id="receive-address-display"
                  className="flex-1 break-all font-mono text-xs"
                  data-testid="receive-address"
                >
                  {address}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0"
                  aria-label="Copy address"
                  data-testid="copy-address-inline"
                  onClick={() => copyText(address, "Address")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                data-testid="copy-address-button"
                onClick={() => copyText(address, "Address")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                data-testid="share-address-button"
                onClick={() => shareText("My Stellar Address", getShareText("address"), "Address")}
              >
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="h-4 w-4" aria-hidden="true" />
              <span>Scan QR code or copy address to receive XLM</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Only send Stellar Lumens (XLM) to this address. Sending other cryptocurrencies may
              result in permanent loss.
            </p>
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="request" className="space-y-4">
        <Card className="p-6" data-testid="receive-request-card">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receive-amount">Amount (XLM)</Label>
              <Input
                id="receive-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? "receive-amount-error" : undefined}
                data-testid="receive-amount-input"
                onChange={(e) => setAmount(e.target.value)}
              />
              {amountError && (
                <p
                  id="receive-amount-error"
                  role="alert"
                  className="text-sm text-destructive"
                  data-testid="receive-amount-error"
                >
                  {amountError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="receive-memo">Memo (Optional)</Label>
              <Input
                id="receive-memo"
                placeholder="Payment reference"
                value={memo}
                data-testid="receive-memo-input"
                onChange={(e) => setMemo(e.target.value)}
              />
            </div>

            <div className="space-y-4 text-center">
              <QRDisplay
                value={paymentQR.value}
                label="QR code for payment request"
                testId="payment-qr"
              />

              <ReceiveSummary qrData={paymentQR} />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={!!amountError}
                data-testid="copy-payment-button"
                onClick={() => copyText(paymentQR.value, "Payment request")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={!!amountError}
                data-testid="share-payment-button"
                onClick={() =>
                  shareText(
                    "Payment Request",
                    getShareText("payment-request"),
                    "Payment request"
                  )
                }
              >
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
