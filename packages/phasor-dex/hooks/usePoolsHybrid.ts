import { useMemo } from "react";
import { usePools } from "./usePools";
import { usePoolsFromSubgraph } from "./usePoolsFromSubgraph";
import { Pool } from "@/types";

interface UsePoolsHybridResult {
  pools: Pool[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hybrid hook that combines direct contract calls with subgraph data.
 *
 * Strategy:
 * 1. Always fetch pools from direct contract calls (works on Monad despite historical call limitations)
 * 2. Attempt to fetch additional data from subgraph (volume, APR, TVL)
 * 3. Merge the data, enriching contract pools with subgraph data when available
 *
 * This ensures:
 * - Pools always show up (from contract calls)
 * - Historical data is shown when available (from subgraph)
 * - Graceful degradation if subgraph has issues
 */
export function usePoolsHybrid(): UsePoolsHybridResult {
  // Primary source: Direct contract calls (always works on Monad)
  const { pools: contractPools, isLoading: isContractLoading } = usePools();

  // Secondary source: Subgraph data (may have issues with historical eth_call on Monad)
  const { pools: subgraphPools, isLoading: isSubgraphLoading, error } = usePoolsFromSubgraph();

  // Merge the data: Start with contract pools, enrich with subgraph data
  const enrichedPools = useMemo(() => {
    if (contractPools.length === 0) return [];

    // Create a map of subgraph pools by address for quick lookup
    const subgraphPoolMap = new Map(
      subgraphPools.map(pool => [pool.address.toLowerCase(), pool])
    );

    // Enrich contract pools with subgraph data when available
    return contractPools.map(contractPool => {
      const subgraphPool = subgraphPoolMap.get(contractPool.address.toLowerCase());

      if (!subgraphPool) {
        // No subgraph data available - return contract data only
        return contractPool;
      }

      // Merge: Use contract data as base, add subgraph enrichment
      return {
        ...contractPool,
        // Add subgraph-only fields
        tvlUSD: subgraphPool.tvlUSD,
        volume24hUSD: subgraphPool.volume24hUSD,
        apr: subgraphPool.apr,
        // Prefer subgraph token metadata (it has the correct names/symbols)
        token0: {
          ...contractPool.token0,
          symbol: subgraphPool.token0.symbol || contractPool.token0.symbol,
          name: subgraphPool.token0.name || contractPool.token0.name,
        },
        token1: {
          ...contractPool.token1,
          symbol: subgraphPool.token1.symbol || contractPool.token1.symbol,
          name: subgraphPool.token1.name || contractPool.token1.name,
        },
      };
    });
  }, [contractPools, subgraphPools]);

  return {
    pools: enrichedPools,
    // Only show loading if contract data is loading (subgraph is optional)
    isLoading: isContractLoading,
    error,
  };
}
