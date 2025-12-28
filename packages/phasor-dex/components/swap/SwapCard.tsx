"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import { ArrowDown, ChevronDown, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";
import { Token } from "@/types";
import { useSwap, useTokenBalance } from "@/hooks";
import { formatTokenAmount, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenSelector } from "@/components/common/TokenSelector";
import { SettingsPopover } from "@/components/common/SettingsPopover";
import { BackgroundGradient } from "@/components/ui/background-gradient";

interface TokenInputProps {
  label: string;
  token: Token | null;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  disabled?: boolean;
  showMaxButton?: boolean;
}

function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  disabled,
  showMaxButton,
}: TokenInputProps) {
  const { balance, isLoading: balanceLoading } = useTokenBalance(token);

  const handleMax = () => {
    if (token && balance > BigInt(0)) {
      onAmountChange(formatUnits(balance, token.decimals));
    }
  };

  return (
    <div className="rounded border border-border bg-muted p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {balanceLoading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <>
              <span>Balance: {token ? formatTokenAmount(balance, token.decimals, 4) : "0"}</span>
              {showMaxButton && token && balance > BigInt(0) && (
                <button
                  onClick={handleMax}
                  className="text-foreground hover:text-primary font-medium"
                >
                  MAX
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => {
            // Only allow valid number input
            const value = e.target.value;
            if (value === "" || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
              onAmountChange(value.replace(",", "."));
            }
          }}
          disabled={disabled}
          className="token-input flex-1 min-w-0"
        />

        <Button
          variant="secondary"
          onClick={onTokenSelect}
          className="flex items-center gap-2 px-3 h-10 rounded-xl shrink-0"
        >
          {token ? (
            <>
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {token.logoURI ? (
                  <Image
                    src={token.logoURI}
                    alt={token.symbol}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold">
                    {token.symbol.charAt(0)}
                  </span>
                )}
              </div>
              <span className="font-medium">{token.symbol}</span>
            </>
          ) : (
            <span className="text-foreground">Select token</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SwapCard() {
  const { isConnected, address } = useAccount();
  const [mounted, setMounted] = useState(false);

  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [selectorOpen, setSelectorOpen] = useState<"input" | "output" | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    quote,
    isLoading,
    needsApproval,
    isApproving,
    isSwapping,
    approve,
    swap,
    error,
    gasEstimate,
    gasCost,
  } = useSwap(inputToken, outputToken, inputAmount);

  // Handle token switch
  const handleSwitch = useCallback(() => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount("");
  }, [inputToken, outputToken]);

  // Handle token selection - swap positions if selecting the other token
  const handleSelectToken = (token: Token) => {
    if (selectorOpen === "input") {
      if (outputToken?.address === token.address) {
        // Swap the tokens
        setInputToken(outputToken);
        setOutputToken(inputToken);
      } else {
        setInputToken(token);
      }
    } else {
      if (inputToken?.address === token.address) {
        // Swap the tokens
        setOutputToken(inputToken);
        setInputToken(outputToken);
      } else {
        setOutputToken(token);
      }
    }
  };

  // Format output amount
  const outputAmount = useMemo(() => {
    if (!quote || !outputToken) return "";
    return formatUnits(quote.amountOut, outputToken.decimals);
  }, [quote, outputToken]);

  // Determine button state
  const buttonState = useMemo(() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true, action: null };
    if (!inputToken || !outputToken) return { text: "Select tokens", disabled: true, action: null };
    if (!inputAmount || inputAmount === "0") return { text: "Enter amount", disabled: true, action: null };
    if (isLoading) return { text: "Loading...", disabled: true, action: null };
    if (!quote) return { text: "Insufficient liquidity", disabled: true, action: null };
    if (needsApproval) return { text: `Approve ${inputToken.symbol}`, disabled: false, action: "approve" };
    if (isApproving) return { text: "Approving...", disabled: true, action: null };
    if (isSwapping) return { text: "Swapping...", disabled: true, action: null };
    return { text: "Swap", disabled: false, action: "swap" };
  }, [isConnected, inputToken, outputToken, inputAmount, isLoading, quote, needsApproval, isApproving, isSwapping]);

  const handleButtonClick = async () => {
    if (buttonState.action === "approve") {
      await approve();
    } else if (buttonState.action === "swap") {
      await swap();
    }
  };

  return (
    <>
      <BackgroundGradient variant="white" className="w-full max-w-md mx-auto">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-4 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Swap</h2>
            <SettingsPopover />
          </div>

          {/* Input */}
          <TokenInput
            label="You pay"
            token={inputToken}
            amount={inputAmount}
            onAmountChange={setInputAmount}
            onTokenSelect={() => setSelectorOpen("input")}
            showMaxButton
          />

          {/* Switch Button */}
          <div className="flex justify-center -my-2">
            <button
              onClick={handleSwitch}
              className="p-2 rounded border border-border bg-card hover:bg-muted transition-all swap-arrow"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
          </div>

          {/* Output */}
          <TokenInput
            label="You receive"
            token={outputToken}
            amount={outputAmount}
            onAmountChange={() => {}} // Output is calculated
            onTokenSelect={() => setSelectorOpen("output")}
            disabled
          />

          {/* Price Info */}
          {quote && inputToken && outputToken && (
            <div className="space-y-2 p-3 rounded border border-border bg-secondary text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>
                  1 {inputToken.symbol} ≈{" "}
                  {(Number(quote.amountOut) / Number(quote.amountIn) *
                    Math.pow(10, inputToken.decimals - outputToken.decimals)).toFixed(6)}{" "}
                  {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span
                  className={cn(
                    quote.priceImpact > 3
                      ? "text-red-500"
                      : quote.priceImpact > 1
                      ? "text-yellow-500"
                      : "text-green-500"
                  )}
                >
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum received</span>
                <span>
                  {formatTokenAmount(quote.minimumReceived, outputToken.decimals, 6)}{" "}
                  {outputToken.symbol}
                </span>
              </div>
              {gasEstimate && gasCost && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated gas</span>
                  <span>
                    {gasEstimate} ({gasCost})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div>
            {!mounted || !isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <Button
                    className="w-full py-6 font-semibold"
                    onClick={openConnectModal}
                    disabled={!mounted}
                  >
                    {mounted ? "Connect Wallet" : "Loading..."}
                  </Button>
                )}
              </ConnectButton.Custom>
            ) : (
              <Button
                className={cn(
                  "w-full py-6 font-semibold",
                  buttonState.disabled && "opacity-50 cursor-not-allowed"
                )}
                onClick={handleButtonClick}
                disabled={buttonState.disabled}
              >
                {isApproving || isSwapping ? (
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {buttonState.text}
                  </div>
                ) : (
                  buttonState.text
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </BackgroundGradient>

      {/* Token Selector Modal */}
      <TokenSelector
        open={selectorOpen !== null}
        onClose={() => setSelectorOpen(null)}
        onSelect={handleSelectToken}
        selectedToken={selectorOpen === "input" ? inputToken : outputToken}
        otherToken={selectorOpen === "input" ? outputToken : inputToken}
      />
    </>
  );
}
