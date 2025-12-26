"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { Token } from "@/types";
import { DEFAULT_TOKENS, NATIVE_TOKEN } from "@/config";
import { useTokenListStore } from "@/lib/store";
import { useTokenBalance } from "@/hooks";
import { formatTokenAmount, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
interface TokenSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token | null;
  otherToken?: Token | null;
}

function TokenRow({
  token,
  onSelect,
  disabled,
}: {
  token: Token;
  onSelect: (token: Token) => void;
  disabled: boolean;
}) {
  const { balance, isLoading } = useTokenBalance(token);

  return (
    <button
      onClick={() => onSelect(token)}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-surface-4 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-surface-4 flex items-center justify-center overflow-hidden">
          {token.logoURI ? (
            <Image
              src={token.logoURI}
              alt={token.symbol}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-phasor-500">
              {token.symbol.charAt(0)}
            </span>
          )}
        </div>
        <div className="text-left">
          <p className="font-medium">{token.symbol}</p>
          <p className="text-sm text-muted-foreground">{token.name}</p>
        </div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <p className="font-medium">
            {formatTokenAmount(balance, token.decimals, 4)}
          </p>
        )}
      </div>
    </button>
  );
}

export function TokenSelector({
  open,
  onClose,
  onSelect,
  selectedToken,
  otherToken,
}: TokenSelectorProps) {
  const [search, setSearch] = useState("");
  const { customTokens } = useTokenListStore();

  // Combine default tokens with custom tokens
  const allTokens = useMemo(() => {
    return [NATIVE_TOKEN, ...DEFAULT_TOKENS, ...customTokens];
  }, [customTokens]);

  // Filter tokens based on search
  const filteredTokens = useMemo(() => {
    if (!search) return allTokens;
    const searchLower = search.toLowerCase();
    return allTokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(searchLower) ||
        token.name.toLowerCase().includes(searchLower) ||
        token.address.toLowerCase() === searchLower
    );
  }, [allTokens, search]);

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name or paste address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Token List */}
        <div className="border-t border-surface-4 pt-4 max-h-[300px] overflow-y-auto space-y-1">
          {filteredTokens.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tokens found
            </p>
          ) : (
            filteredTokens.map((token) => (
              <TokenRow
                key={token.address}
                token={token}
                onSelect={handleSelect}
                disabled={selectedToken?.address === token.address}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
