"use client";

import { useState } from "react";
import { Pool } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PoolDetailChartProps {
  pool: Pool;
}

type ChartPeriod = "1D" | "1W" | "1M" | "ALL";

export function PoolDetailChart({ pool }: PoolDetailChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>("1W");

  // TODO: Implement actual chart with data from subgraph
  // For now, show a placeholder

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Liquidity & Volume</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
            <TabsList>
              <TabsTrigger value="1D">1D</TabsTrigger>
              <TabsTrigger value="1W">1W</TabsTrigger>
              <TabsTrigger value="1M">1M</TabsTrigger>
              <TabsTrigger value="ALL">ALL</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Chart visualization coming soon
            </p>
            <p className="text-xs text-muted-foreground/70">
              Historical liquidity and volume data for {period}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
