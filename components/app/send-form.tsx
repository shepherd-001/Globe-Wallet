"use client";

import { useState, useMemo, useId } from "react";
import { Send, CheckCircle2, Loader2, Coins, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WalletErrorAlert } from "@/components/ui/wallet-error-alert";
import { usePricing } from "@/hooks/useFinanceServices";
import { useBalances } from "@/hooks/useBalances";
import { useWalletSend } from "@/hooks/useWalletSend";
import { useContacts } from "@/hooks/useContacts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateFee } from "@/lib/helpers/format";
import type { AssetCode } from "@/lib/types";

export function SendForm() {
  const { send, isProcessing, status, error, result, reset } = useWalletSend();
  const { formatAsset } = usePricing();
  const { assets } = useBalances();
  const contactsState = useContacts();

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetCode>("XLM");
  const [memo, setMemo] = useState("");

  // Unique IDs for aria associations
  const addressId = useId();
  const addressErrorId = useId();
  const amountId = useId();
  const memoId = useId();

  const currentAssetBalance = useMemo(
    () => assets.find((a) => a.code === selectedAsset)?.balance ?? 0,
    [assets, selectedAsset],
  );

  const estimatedFee = useMemo(
    () => calculateFee(parseFloat(amount) || 0),
    [amount],
  );

  const hasAddressError =
    status === "error" && error?.toLowerCase().includes("address");
  const hasAmountError =
    status === "error" && error?.toLowerCase().includes("amount");

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    await send(address, amount, selectedAsset, memo || undefined);
  };

  const handleReset = () => {
    setAddress("");
    setAmount("");
    setMemo("");
    reset();
  };

  return (
    <Card
      className="w-full max-w-md border-primary/20 shadow-2xl bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
      data-testid="send-form-card"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" aria-hidden />
          Send Assets
        </CardTitle>
        <CardDescription>
          Transfer Lumens or tokens securely to any Stellar address.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleReview} aria-label="Send payment form" noValidate>
        <CardContent className="space-y-4">
          {/* Recipient Address */}
          <div className="space-y-2">
            <label htmlFor={addressId} className="text-sm font-medium">
              Recipient Address
            </label>
            <Input
              id={addressId}
              data-testid="address-input"
              placeholder="e.g. GDXSPAY..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-background/50"
              aria-invalid={hasAddressError || undefined}
              aria-describedby={hasAddressError ? addressErrorId : undefined}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Amount + Asset */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <label htmlFor={amountId} className="text-sm font-medium">
                Amount
              </label>
              <Input
                id={amountId}
                data-testid="amount-input"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-background/50"
                aria-invalid={hasAmountError || undefined}
                aria-describedby={hasAmountError ? addressErrorId : undefined}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" id="asset-select-label">
                Asset
              </label>
              <Select
                value={selectedAsset}
                onValueChange={(v) => setSelectedAsset(v as AssetCode)}
              >
                <SelectTrigger
                  className="bg-background/50"
                  aria-labelledby="asset-select-label"
                  data-testid="asset-select"
                >
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem
                      key={asset.code}
                      value={asset.code}
                      data-testid={`asset-option-${asset.code}`}
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-primary" aria-hidden />
                        {asset.code}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Balance + Fee info */}
          <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
            <span>
              Balance:{" "}
              <span data-testid="current-balance">
                {formatAsset(currentAssetBalance, selectedAsset)}
              </span>
            </span>
            {parseFloat(amount) > 0 && (
              <span data-testid="fee-estimate">
                Est. fee: {estimatedFee.toFixed(6)} {selectedAsset}
              </span>
            )}
          </div>

          {/* Memo */}
          <div className="space-y-2">
            <label
              htmlFor={memoId}
              className="text-sm font-medium text-muted-foreground flex items-center justify-between"
            >
              Memo{" "}
              <span className="text-[10px] uppercase font-bold opacity-50 px-1.5 py-0.5 bg-muted rounded">
                Optional
              </span>
            </label>
            <Input
              id={memoId}
              data-testid="memo-input"
              placeholder="Transaction note"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="bg-background/50 h-8 text-sm"
            />
          </div>

          {/* Error state */}
          {status === "error" && error && (
            <WalletErrorAlert
              id={addressErrorId}
              message={error}
              data-testid="send-error"
              onRetry={handleReset}
            />
          )}

          {/* Success state */}
          {status === "success" && result && (
            <div
              role="status"
              aria-live="polite"
              data-testid="send-success"
              className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200"
            >
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                Transaction Successful
              </span>
              {result.hash && (
                <span className="text-xs opacity-80 font-mono break-all">
                  Hash: {result.hash.slice(0, 20)}…
                </span>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="mt-1 text-xs underline self-start"
                data-testid="send-again-btn"
              >
                Send another
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            type="submit"
            className="flex-1 group relative overflow-hidden"
            disabled={isProcessing || status === "success"}
            data-testid="send-submit-btn"
            aria-busy={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
                Processing…
              </>
            ) : (
              <>
                <Send
                  className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform"
                  aria-hidden
                />
                Confirm Send
              </>
            )}
          </Button>
          {status !== "idle" && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleReset}
              aria-label="Reset form"
              data-testid="reset-btn"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
