"use client";

import React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Wallet } from "lucide-react";
import { UserPosition } from "@/types";
import { formatTokenAmount, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PositionRowProps {
  position: UserPosition;
}

function PositionRow({ position }: PositionRowProps) {
  const { pool, share, token0Amount, token1Amount } = position;

  return (
    <div className="p-4 rounded-xl bg-surface-3 hover:bg-surface-4 transition-colors">
      <div className="flex items-center justify-between">
        {/* Pair */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-surface-4 border-2 border-surface-3 flex items-center justify-center z-10">
              <span className="text-xs font-bold text-phasor-500">
                {pool.token0.symbol.charAt(0)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-4 border-2 border-surface-3 flex items-center justify-center">
              <span className="text-xs font-bold text-phasor-500">
                {pool.token1.symbol.charAt(0)}
              </span>
            </div>
          </div>
          <div>
            <p className="font-medium">
              {pool.token0.symbol}/{pool.token1.symbol}
            </p>
            <p className="text-sm text-muted-foreground">
              {share.toFixed(4)}% share
            </p>
          </div>
        </div>

        {/* Value */}
        <div className="text-right">
          <p className="font-medium">$--</p>
          <p className="text-sm text-muted-foreground">
            {formatTokenAmount(token0Amount, pool.token0.decimals, 4)}{" "}
            {pool.token0.symbol} +{" "}
            {formatTokenAmount(token1Amount, pool.token1.decimals, 4)}{" "}
            {pool.token1.symbol}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Link href="/pools/add" className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Add
          </Button>
        </Link>
        <Link href="/pools/remove" className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Remove
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface UserPositionsProps {
  positions?: UserPosition[];
  isLoading?: boolean;
}

export function UserPositions({ positions = [], isLoading }: UserPositionsProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto bg-surface-2 border-surface-4">
        <CardContent className="py-12 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Connect your wallet</h3>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your liquidity positions
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto bg-surface-2 border-surface-4">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Your Positions</h2>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto bg-surface-2 border-surface-4">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-3 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="font-medium mb-2">No positions found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add liquidity to a pool to start earning fees
          </p>
          <Link href="/pools/add">
            <Button>Add Liquidity</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-surface-2 border-surface-4">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Positions</h2>
          <span className="text-sm text-muted-foreground">
            {positions.length} position{positions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="space-y-3">
          {positions.map((position, index) => (
            <PositionRow key={index} position={position} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
