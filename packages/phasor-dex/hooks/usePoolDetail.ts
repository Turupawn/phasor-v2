import { useMemo } from "react";
import { Address } from "viem";
import { useReadContracts } from "wagmi";
import { useQuery } from "@apollo/client/react";
import { Pool, Token } from "@/types";
import { PAIR_ABI } from "@/config";
import { DEFAULT_TOKENS } from "@/config/chains";
import { GET_POOL } from "@/lib/graphql/queries";

interface UsePoolDetailResult {
  pool: Pool | null;
  isLoading: boolean;
  error: Error | null;
}

interface SubgraphToken {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
}

interface SubgraphPairData {
  pair: {
    id: string;
    token0: SubgraphToken;
    token1: SubgraphToken;
    reserve0: string;
    reserve1: string;
    reserveUSD: string;
    volumeUSD: string;
  } | null;
}

/**
 * Hybrid hook to fetch detailed data for a single pool
 * Combines direct contract calls with subgraph enrichment
 */
export function usePoolDetail(poolAddress: string): UsePoolDetailResult {
  const address = poolAddress as Address;

  // Fetch core pool data from contracts
  const { data: contractData, isLoading: isContractLoading } = useReadContracts({
    contracts: [
      {
        address,
        abi: PAIR_ABI,
        functionName: "token0",
      },
      {
        address,
        abi: PAIR_ABI,
        functionName: "token1",
      },
      {
        address,
        abi: PAIR_ABI,
        functionName: "getReserves",
      },
      {
        address,
        abi: PAIR_ABI,
        functionName: "totalSupply",
      },
    ],
  });

  // Fetch enrichment data from subgraph
  const { data: subgraphData, loading: isSubgraphLoading, error: subgraphError } = useQuery<SubgraphPairData>(GET_POOL, {
    variables: { id: poolAddress.toLowerCase() },
    skip: !poolAddress,
  });

  // Combine contract and subgraph data
  const pool = useMemo((): Pool | null => {
    if (!contractData) return null;

    const [token0Result, token1Result, reservesResult, totalSupplyResult] = contractData;

    if (
      token0Result.status !== "success" ||
      token1Result.status !== "success" ||
      reservesResult.status !== "success" ||
      totalSupplyResult.status !== "success"
    ) {
      return null;
    }

    const token0Address = token0Result.result as Address;
    const token1Address = token1Result.result as Address;
    const reserves = reservesResult.result as [bigint, bigint, number];
    const totalSupply = totalSupplyResult.result as bigint;

    // Find token metadata from DEFAULT_TOKENS or subgraph
    const subgraphPair = subgraphData?.pair;

    const token0: Token = {
      address: token0Address,
      symbol: subgraphPair?.token0.symbol ||
              DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token0Address.toLowerCase())?.symbol ||
              `Token${token0Address.slice(0, 6)}`,
      name: subgraphPair?.token0.name ||
            DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token0Address.toLowerCase())?.name ||
            "Unknown Token",
      decimals: subgraphPair?.token0.decimals ?
                parseInt(subgraphPair.token0.decimals) :
                (DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token0Address.toLowerCase())?.decimals || 18),
      logoURI: DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token0Address.toLowerCase())?.logoURI,
    };

    const token1: Token = {
      address: token1Address,
      symbol: subgraphPair?.token1.symbol ||
              DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token1Address.toLowerCase())?.symbol ||
              `Token${token1Address.slice(0, 6)}`,
      name: subgraphPair?.token1.name ||
            DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token1Address.toLowerCase())?.name ||
            "Unknown Token",
      decimals: subgraphPair?.token1.decimals ?
                parseInt(subgraphPair.token1.decimals) :
                (DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token1Address.toLowerCase())?.decimals || 18),
      logoURI: DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token1Address.toLowerCase())?.logoURI,
    };

    // Calculate enrichment data from subgraph if available
    const tvlUSD = subgraphPair?.reserveUSD ? parseFloat(subgraphPair.reserveUSD) : undefined;
    const volumeUSD = subgraphPair?.volumeUSD ? parseFloat(subgraphPair.volumeUSD) : undefined;

    // Calculate APR from 24h volume
    const dailyVolume = volumeUSD ? volumeUSD / 365 : undefined;
    const poolFee = 0.003; // 0.3%
    const apr = tvlUSD && dailyVolume && tvlUSD > 0
      ? ((dailyVolume * poolFee * 365) / tvlUSD) * 100
      : undefined;

    return {
      address,
      token0,
      token1,
      reserve0: reserves[0],
      reserve1: reserves[1],
      totalSupply,
      fee: 30, // 0.3% in basis points
      tvlUSD,
      volume24hUSD: dailyVolume,
      apr,
    };
  }, [contractData, subgraphData, poolAddress]);

  return {
    pool,
    isLoading: isContractLoading || isSubgraphLoading,
    error: subgraphError || null,
  };
}
