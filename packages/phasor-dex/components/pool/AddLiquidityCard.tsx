"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, ChevronDown, AlertTriangle } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";
import { Token } from "@/types";
import { useAddLiquidity, useTokenBalance, usePair } from "@/hooks";
import { formatTokenAmount, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenSelector } from "@/components/common/TokenSelector";
import { SettingsPopover } from "@/components/common/SettingsPopover";

interface TokenInputProps {
  label: string;
  token: Token | null;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  disabled?: boolean;
}

function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  disabled,
}: TokenInputProps) {
  const { balance, isLoading: balanceLoading } = useTokenBalance(token);

  const handleMax = () => {
    if (token && balance > BigInt(0)) {
      onAmountChange(formatUnits(balance, token.decimals));
    }
  };

  return (
    <div className="rounded-2xl bg-surface-3 p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {balanceLoading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <>
              <span>Balance: {token ? formatTokenAmount(balance, token.decimals, 4) : "0"}</span>
              {token && balance > BigInt(0) && (
                <button
                  onClick={handleMax}
                  className="text-phasor-500 hover:text-phasor-400 font-medium"
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
              <div className="w-6 h-6 rounded-full bg-surface-4 flex items-center justify-center overflow-hidden">
                {token.logoURI ? (
                  <Image src={token.logoURI} alt={token.symbol} width={24} height={24} className="rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-phasor-500">{token.symbol.charAt(0)}</span>
                )}
              </div>
              <span className="font-medium">{token.symbol}</span>
            </>
          ) : (
            <span className="text-phasor-500">Select token</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function AddLiquidityCard() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [selectorOpen, setSelectorOpen] = useState<"A" | "B" | null>(null);
  const [activeField, setActiveField] = useState<"A" | "B">("A");

  const { exists, isLoading: pairLoading } = usePair(tokenA, tokenB);

  const {
    quote,
    isLoading,
    needsApprovalA,
    needsApprovalB,
    isApproving,
    isAdding,
    approveA,
    approveB,
    addLiquidity,
    error,
    calculateAmountB,
    calculateAmountA,
  } = useAddLiquidity(tokenA, tokenB, amountA, amountB);

  // Auto-calculate paired amount when pool exists
  useEffect(() => {
    if (!exists || pairLoading) return;
    
    if (activeField === "A" && amountA && tokenA && tokenB) {
      const calculated = calculateAmountB(amountA);
      if (calculated) setAmountB(calculated);
    } else if (activeField === "B" && amountB && tokenA && tokenB) {
      const calculated = calculateAmountA(amountB);
      if (calculated) setAmountA(calculated);
    }
  }, [amountA, amountB, activeField, exists, pairLoading, calculateAmountA, calculateAmountB, tokenA, tokenB]);

  const handleAmountAChange = (value: string) => {
    setActiveField("A");
    setAmountA(value);
  };

  const handleAmountBChange = (value: string) => {
    setActiveField("B");
    setAmountB(value);
  };

  const handleSelectToken = (token: Token) => {
    if (selectorOpen === "A") {
      setTokenA(token);
      if (tokenB?.address === token.address) setTokenB(null);
    } else {
      setTokenB(token);
      if (tokenA?.address === token.address) setTokenA(null);
    }
    setAmountA("");
    setAmountB("");
  };

  // Button state
  const buttonState = (() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true, action: null };
    if (!tokenA || !tokenB) return { text: "Select tokens", disabled: true, action: null };
    if (!amountA || !amountB || amountA === "0" || amountB === "0") {
      return { text: "Enter amounts", disabled: true, action: null };
    }
    if (isLoading) return { text: "Loading...", disabled: true, action: null };
    if (needsApprovalA) return { text: `Approve ${tokenA.symbol}`, disabled: false, action: "approveA" };
    if (needsApprovalB) return { text: `Approve ${tokenB.symbol}`, disabled: false, action: "approveB" };
    if (isApproving) return { text: "Approving...", disabled: true, action: null };
    if (isAdding) return { text: "Adding liquidity...", disabled: true, action: null };
    return { text: "Add Liquidity", disabled: false, action: "add" };
  })();

  const handleButtonClick = async () => {
    if (buttonState.action === "approveA") await approveA();
    else if (buttonState.action === "approveB") await approveB();
    else if (buttonState.action === "add") await addLiquidity();
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto border-gradient glow-effect">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/pools")}
                className="rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle>Add Liquidity</CardTitle>
            </div>
            <SettingsPopover />
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* First Token */}
          <TokenInput
            label="Token A"
            token={tokenA}
            amount={amountA}
            onAmountChange={handleAmountAChange}
            onTokenSelect={() => setSelectorOpen("A")}
          />

          {/* Plus Icon */}
          <div className="flex justify-center -my-1">
            <div className="p-2 rounded-xl bg-surface-4 border-4 border-surface-2">
              <Plus className="h-5 w-5" />
            </div>
          </div>

          {/* Second Token */}
          <TokenInput
            label="Token B"
            token={tokenB}
            amount={amountB}
            onAmountChange={handleAmountBChange}
            onTokenSelect={() => setSelectorOpen("B")}
          />

          {/* Pool Info */}
          {tokenA && tokenB && (
            <div className="p-4 rounded-xl bg-surface-3/50 space-y-3">
              {!exists ? (
                <div className="flex items-start gap-2 text-yellow-500">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Creating new pool</p>
                    <p className="text-muted-foreground">
                      You are the first to provide liquidity. The ratio you set will
                      determine the initial price.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-medium">Pool Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {tokenA.symbol} per {tokenB.symbol}
                      </span>
                      <span>
                        {amountA && amountB && parseFloat(amountB) > 0
                          ? (parseFloat(amountA) / parseFloat(amountB)).toFixed(6)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {tokenB.symbol} per {tokenA.symbol}
                      </span>
                      <span>
                        {amountA && amountB && parseFloat(amountA) > 0
                          ? (parseFloat(amountB) / parseFloat(amountA)).toFixed(6)
                          : "-"}
                      </span>
                    </div>
                    {quote && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Share of pool</span>
                        <span className="text-phasor-500">
                          {quote.shareOfPool.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Action Button */}
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button size="xl" className="w-full" onClick={openConnectModal}>
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          ) : (
            <Button
              size="xl"
              className="w-full"
              disabled={buttonState.disabled}
              onClick={handleButtonClick}
              isLoading={isApproving || isAdding}
            >
              {buttonState.text}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Token Selector */}
      <TokenSelector
        open={selectorOpen !== null}
        onClose={() => setSelectorOpen(null)}
        onSelect={handleSelectToken}
        selectedToken={selectorOpen === "A" ? tokenA : tokenB}
        otherToken={selectorOpen === "A" ? tokenB : tokenA}
      />
    </>
  );
}
