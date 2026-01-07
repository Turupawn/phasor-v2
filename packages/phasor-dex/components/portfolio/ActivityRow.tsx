"use client";

import Link from "next/link";
import { PortfolioTransaction } from "@/types";
import { ExternalLink } from "lucide-react";

interface ActivityRowProps {
  transaction: PortfolioTransaction;
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTransactionType(type: PortfolioTransaction["type"]): string {
  switch (type) {
    case "swap":
      return "Swap";
    case "mint":
      return "Add Liquidity";
    case "burn":
      return "Remove Liquidity";
    default:
      return type;
  }
}

export function ActivityRow({ transaction }: ActivityRowProps) {
  const explorerUrl = `https://monad.explorer/tx/${transaction.hash}`;

  return (
    <>
      {/* Desktop Row */}
      <tr className="hidden md:table-row border-b border-border hover:bg-muted/50 transition-colors">
        {/* Time */}
        <td className="py-4 px-4 text-muted-foreground">
          {formatTimestamp(transaction.timestamp)}
        </td>

        {/* Type */}
        <td className="py-4 px-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
            {formatTransactionType(transaction.type)}
          </span>
        </td>

        {/* Amount */}
        <td className="py-4 px-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className={transaction.type === "swap" && transaction.amount0.startsWith("-") ? "text-red-500" : ""}>
                {transaction.amount0}
              </span>
              <span className="text-muted-foreground">{transaction.token0.symbol}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={transaction.type === "swap" && transaction.amount1.startsWith("-") ? "text-red-500" : ""}>
                {transaction.amount1}
              </span>
              <span className="text-muted-foreground">{transaction.token1.symbol}</span>
            </div>
          </div>
        </td>

        {/* Value */}
        <td className="py-4 px-4 text-muted-foreground">
          ${transaction.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>

        {/* Transaction */}
        <td className="py-4 px-4">
          <Link
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <span className="font-mono text-sm">
              {transaction.hash.substring(0, 6)}...{transaction.hash.substring(transaction.hash.length - 4)}
            </span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </td>
      </tr>

      {/* Mobile Card */}
      <div className="md:hidden border border-border rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
              {formatTransactionType(transaction.type)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatTimestamp(transaction.timestamp)}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <div className="text-right">
              <div className={transaction.type === "swap" && transaction.amount0.startsWith("-") ? "text-red-500" : ""}>
                {transaction.amount0} {transaction.token0.symbol}
              </div>
              <div className={transaction.type === "swap" && transaction.amount1.startsWith("-") ? "text-red-500" : ""}>
                {transaction.amount1} {transaction.token1.symbol}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-medium">
              ${transaction.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <Link
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <span className="font-mono">
            {transaction.hash.substring(0, 6)}...{transaction.hash.substring(transaction.hash.length - 4)}
          </span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </>
  );
}
