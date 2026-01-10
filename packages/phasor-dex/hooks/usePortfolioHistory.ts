"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { GET_TOKEN_PRICE_HISTORY } from "@/lib/graphql/queries";
import { tokensApolloClient } from "@/lib/apollo-client";
import { useUserPositions } from "./useUserPositions";
import { useTokenBalances } from "./useTokenBalance";
import { PortfolioHistoryPoint, Token } from "@/types";

export type HistoryPeriod = "1D" | "1W" | "1M" | "ALL";

export interface UsePortfolioHistoryResult {
  data: PortfolioHistoryPoint[];
  isLoading: boolean;
  error: Error | null;
}

interface TokenDayData {
  date: string;
  token: {
    id: string;
    decimals: string;
  };
  priceUSD: string;
  dailyVolumeUSD: string;
}

interface TokenPriceHistoryData {
  bundle?: {
    ethPrice: string;
  };
  tokenDayDatas?: TokenDayData[];
}

const PERIOD_TO_DAYS: Record<HistoryPeriod, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "ALL": 365, // Cap at 1 year for performance
};

export function usePortfolioHistory(
  tokenList: Token[],
  period: HistoryPeriod = "1M"
): UsePortfolioHistoryResult {
  const { address: userAddress } = useAccount();
  const { positions } = useUserPositions();

  // Get current token balances
  const balances = useTokenBalances(tokenList, !!userAddress);

  // Extract all unique token addresses (from wallet + LP positions)
  const allTokenAddresses = useMemo(() => {
    const addresses = new Set<Address>();

    // Add tokens from token list that have balances
    tokenList.forEach(token => {
      const balance = balances.get(token.address);
      if (balance && balance > BigInt(0)) {
        addresses.add(token.address);
      }
    });

    // Add tokens from LP positions
    positions.forEach(position => {
      addresses.add(position.pool.token0.address);
      addresses.add(position.pool.token1.address);
    });

    return Array.from(addresses);
  }, [tokenList, balances, positions]);

  // Create token map for quick lookup
  const tokenMap = useMemo(() => {
    const map = new Map<Address, Token>();
    tokenList.forEach(token => map.set(token.address, token));
    positions.forEach(position => {
      map.set(position.pool.token0.address, position.pool.token0);
      map.set(position.pool.token1.address, position.pool.token1);
    });
    return map;
  }, [tokenList, positions]);

  // Calculate start time based on period
  const startTime = useMemo(() => {
    const days = PERIOD_TO_DAYS[period];
    const now = Math.floor(Date.now() / 1000);
    const daysAgo = now - days * 86400;
    return Math.floor(daysAgo / 86400) * 86400; // Round to day boundary
  }, [period]);

  // Fetch historical price data
  const { data, loading, error } = useQuery<TokenPriceHistoryData>(GET_TOKEN_PRICE_HISTORY, {
    client: tokensApolloClient,
    variables: {
      startTime,
    },
    skip: !userAddress || allTokenAddresses.length === 0,
    fetchPolicy: 'cache-first', // Use cached data when available
    nextFetchPolicy: 'cache-first', // Continue using cache after initial fetch
  });

  // Process historical data
  const historyData = useMemo(() => {
    if (!data || !data.tokenDayDatas) {
      return [];
    }

    // Group price data by date
    const pricesByDate = new Map<number, Map<Address, number>>();

    data.tokenDayDatas.forEach((dayData: any) => {
      const date = parseInt(dayData.date);
      const tokenId = dayData.token.id.toLowerCase() as Address;
      const priceUSD = parseFloat(dayData.priceUSD || "0");

      // Only include tokens that the user holds
      if (!allTokenAddresses.includes(tokenId)) {
        return;
      }

      if (!pricesByDate.has(date)) {
        pricesByDate.set(date, new Map());
      }

      pricesByDate.get(date)!.set(tokenId, priceUSD);
    });

    // Calculate total portfolio value for each date
    const historyPoints: PortfolioHistoryPoint[] = [];

    // Sort dates
    const sortedDates = Array.from(pricesByDate.keys()).sort((a, b) => a - b);

    sortedDates.forEach(date => {
      const prices = pricesByDate.get(date)!;
      let totalValueUSD = 0;

      // Add token values
      tokenList.forEach(token => {
        const balance = balances.get(token.address);
        const price = prices.get(token.address);

        if (balance && price) {
          const balanceFloat = Number(balance) / Math.pow(10, token.decimals);
          totalValueUSD += balanceFloat * price;
        }
      });

      // Add LP position values
      positions.forEach(position => {
        const token0Price = prices.get(position.pool.token0.address);
        const token1Price = prices.get(position.pool.token1.address);

        if (token0Price && token1Price) {
          const token0Amount =
            Number(position.token0Amount) /
            Math.pow(10, position.pool.token0.decimals);
          const token1Amount =
            Number(position.token1Amount) /
            Math.pow(10, position.pool.token1.decimals);

          totalValueUSD += token0Amount * token0Price + token1Amount * token1Price;
        }
      });

      historyPoints.push({
        timestamp: date,
        totalValueUSD,
      });
    });

    return historyPoints;
  }, [data, tokenList, balances, positions]);

  return {
    data: historyData,
    isLoading: loading,
    error: error || null,
  };
}
