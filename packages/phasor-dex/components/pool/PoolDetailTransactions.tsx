"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PoolDetailTransactionsProps {
  poolAddress: string;
}

export function PoolDetailTransactions({ poolAddress }: PoolDetailTransactionsProps) {
  // TODO: Fetch actual transactions from subgraph
  // For now, show a placeholder

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center h-32 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">
                Transaction history coming soon
              </p>
              <p className="text-xs text-muted-foreground/70">
                View swaps, adds, and removes for this pool
              </p>
            </div>
          </div>

          {/* Example of what the transaction list would look like */}
          <div className="hidden">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div>
                  <p className="font-medium">Swap</p>
                  <p className="text-sm text-muted-foreground">
                    100 TOKEN0 → 50 TOKEN1
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm">$1,234.56</p>
                <a
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  View tx
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
