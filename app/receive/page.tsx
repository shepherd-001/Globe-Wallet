"use client"

import { useState } from "react"
import { AppShell } from "@/components/app/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Share, ArrowLeft, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import { toast } from "sonner"

export default function ReceivePage() {
  const [amount, setAmount] = useState("")
  const [memo, setMemo] = useState("")
  
  // Mock Stellar address - in real app this would come from wallet
  const stellarAddress = "GCKFBEIYTKP33HLSB67JDDK6HDKZGSPNGDHCYE6ZDEJ7JBQQTGXCUO7D"
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }
  
  const shareAddress = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Stellar Address',
        text: `Send XLM to: ${stellarAddress}`,
      })
    } else {
      copyToClipboard(stellarAddress, "Address")
    }
  }
  
  const generatePaymentQR = () => {
    let qrData = stellarAddress
    if (amount) {
      qrData += `?amount=${amount}`
    }
    if (memo) {
      qrData += `${amount ? '&' : '?'}memo=${encodeURIComponent(memo)}`
    }
    return qrData
  }

  return (
    <AppShell>
      <div className="flex items-center gap-4 p-4 pb-2">
        <Link
          href="/"
          aria-label="Go back to home"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <h1 className="text-lg font-semibold">Receive XLM</h1>
      </div>

      <div className="px-4 pb-4">
        <Tabs defaultValue="address" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
          </TabsList>
          
          <TabsContent value="address" className="space-y-4">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-2xl">
                    <QRCodeSVG
                      value={stellarAddress}
                      size={160}
                      level="M"
                      includeMargin={false}
                      title="QR code for Stellar receive address"
                      aria-label="QR code for Stellar receive address"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Your Stellar Address
                  </Label>
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
                    <code className="flex-1 text-xs font-mono break-all">
                      {stellarAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => copyToClipboard(stellarAddress, "Address")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => copyToClipboard(stellarAddress, "Address")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={shareAddress}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="h-4 w-4" />
                  <span>Scan QR code or copy address to receive XLM</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only send Stellar Lumens (XLM) to this address. Sending other cryptocurrencies may result in permanent loss.
                </p>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="request" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (XLM)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memo">Memo (Optional)</Label>
                  <Input
                    id="memo"
                    placeholder="Payment reference"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>
                
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-2xl">
                      <QRCodeSVG
                        value={generatePaymentQR()}
                        size={160}
                        level="M"
                        includeMargin={false}
                        title="QR code for payment request"
                        aria-label="QR code for payment request"
                      />
                    </div>
                  </div>
                  
                  {(amount || memo) && (
                    <div className="text-left space-y-2 p-3 bg-secondary rounded-lg">
                      {amount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">{amount} XLM</span>
                        </div>
                      )}
                      {memo && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Memo:</span>
                          <span className="font-medium">{memo}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => copyToClipboard(generatePaymentQR(), "Payment request")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Payment Request',
                          text: `Send ${amount || 'XLM'} to: ${stellarAddress}${memo ? `\nMemo: ${memo}` : ''}`,
                        })
                      } else {
                        copyToClipboard(generatePaymentQR(), "Payment request")
                      }
                    }}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}