"use client";

import { useAccount, useBalance, useBlockNumber, useChainId } from "wagmi";
import { Card, CardContent } from "@/components/ui/card";
import { CONTRACTS } from "@/config";

export function NetworkDebug() {
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const { data: blockNumber } = useBlockNumber({ watch: true });

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto mt-4 border-yellow-500/50">
        <CardContent className="p-4">
          <h3 className="font-bold text-yellow-500 mb-2">Debug: Not Connected</h3>
          <p className="text-sm text-muted-foreground">
            Wallet is not connected. Connect your wallet to see debug info.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4 border-blue-500/50">
      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-blue-500 mb-2">Network Debug Info</h3>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Address:</div>
          <div className="font-mono text-xs break-all">{address}</div>

          <div className="text-muted-foreground">Chain ID:</div>
          <div>{chainId}</div>

          <div className="text-muted-foreground">Chain Name:</div>
          <div>{chain?.name || "Unknown"}</div>

          <div className="text-muted-foreground">Native Balance:</div>
          <div>{balance ? `${balance.formatted} ${balance.symbol}` : "Loading..."}</div>

          <div className="text-muted-foreground">Block Number:</div>
          <div>{blockNumber ? String(blockNumber) : "Loading..."}</div>

          <div className="text-muted-foreground">Factory:</div>
          <div className="font-mono text-xs break-all">{CONTRACTS.FACTORY}</div>

          <div className="text-muted-foreground">Router:</div>
          <div className="font-mono text-xs break-all">{CONTRACTS.ROUTER}</div>

          <div className="text-muted-foreground">WMON:</div>
          <div className="font-mono text-xs break-all">{CONTRACTS.WMON}</div>
        </div>

        {chain?.unsupported && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
            <strong>Warning:</strong> You're connected to an unsupported network.
            Please switch to chain ID 143.
          </div>
        )}

        {blockNumber === undefined && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded text-yellow-500 text-sm">
            <strong>Warning:</strong> Cannot fetch block number. Check if your RPC is running at http://127.0.0.1:8545
          </div>
        )}
      </CardContent>
    </Card>
  );
}
