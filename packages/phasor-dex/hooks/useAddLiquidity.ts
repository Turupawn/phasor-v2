import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { Address, erc20Abi, parseUnits, formatUnits } from "viem";
import { Token, AddLiquidityQuote } from "@/types";
import { CONTRACTS, ROUTER_ABI, NATIVE_TOKEN } from "@/config";
import { useOrderedReserves } from "./usePair";
import { useSettingsStore, useTransactionStore } from "@/lib/store";
import { quote, getDeadline, calculatePoolShare } from "@/lib/utils";

interface UseAddLiquidityResult {
  quote: AddLiquidityQuote | null;
  isLoading: boolean;
  exists: boolean;
  reserveA: bigint;
  reserveB: bigint;
  totalSupply: bigint;
  needsApprovalA: boolean;
  needsApprovalB: boolean;
  isApproving: boolean;
  isAdding: boolean;
  isSuccess: boolean;
  approveA: () => Promise<void>;
  approveB: () => Promise<void>;
  addLiquidity: () => Promise<void>;
  error: string | null;
  // For the UI to calculate the other amount
  calculateAmountB: (amountA: string) => string;
  calculateAmountA: (amountB: string) => string;
}

export function useAddLiquidity(
  tokenA: Token | null,
  tokenB: Token | null,
  amountA: string,
  amountB: string
): UseAddLiquidityResult {
  const { address: account } = useAccount();
  const { slippageTolerance, deadline } = useSettingsStore();
  const { addTransaction } = useTransactionStore();
  
  const [error, setError] = useState<string | null>(null);

  // Get pair reserves
  const { reserveA, reserveB, isLoading: reservesLoading, exists, totalSupply } = useOrderedReserves(
    tokenA,
    tokenB
  );

  // Parse amounts
  const parsedAmountA = useMemo(() => {
    if (!amountA || !tokenA) return BigInt(0);
    try {
      return parseUnits(amountA, tokenA.decimals);
    } catch {
      return BigInt(0);
    }
  }, [amountA, tokenA]);

  const parsedAmountB = useMemo(() => {
    if (!amountB || !tokenB) return BigInt(0);
    try {
      return parseUnits(amountB, tokenB.decimals);
    } catch {
      return BigInt(0);
    }
  }, [amountB, tokenB]);

  // Calculate quote for other token based on reserves
  const calculateAmountB = useCallback(
    (amtA: string): string => {
      if (!tokenA || !tokenB || !amtA || reserveA === BigInt(0)) return "";
      try {
        const parsedA = parseUnits(amtA, tokenA.decimals);
        const amtB = quote(parsedA, reserveA, reserveB);
        return formatUnits(amtB, tokenB.decimals);
      } catch {
        return "";
      }
    },
    [tokenA, tokenB, reserveA, reserveB]
  );

  const calculateAmountA = useCallback(
    (amtB: string): string => {
      if (!tokenA || !tokenB || !amtB || reserveB === BigInt(0)) return "";
      try {
        const parsedB = parseUnits(amtB, tokenB.decimals);
        const amtA = quote(parsedB, reserveB, reserveA);
        return formatUnits(amtA, tokenA.decimals);
      } catch {
        return "";
      }
    },
    [tokenA, tokenB, reserveA, reserveB]
  );

  // Calculate liquidity quote
  const liquidityQuote = useMemo((): AddLiquidityQuote | null => {
    if (!tokenA || !tokenB || parsedAmountA === BigInt(0) || parsedAmountB === BigInt(0)) {
      return null;
    }

    let liquidity: bigint;
    let shareOfPool: number;

    if (!exists || totalSupply === BigInt(0)) {
      // First liquidity provider
      // liquidity = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
      const product = parsedAmountA * parsedAmountB;
      liquidity = BigInt(Math.floor(Math.sqrt(Number(product)))) - BigInt(1000);
      shareOfPool = 100;
    } else {
      // Existing pool
      const liquidityA = (parsedAmountA * totalSupply) / reserveA;
      const liquidityB = (parsedAmountB * totalSupply) / reserveB;
      liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;
      shareOfPool = calculatePoolShare(liquidity, totalSupply + liquidity);
    }

    return {
      amount0: parsedAmountA,
      amount1: parsedAmountB,
      liquidity,
      shareOfPool,
    };
  }, [tokenA, tokenB, parsedAmountA, parsedAmountB, exists, totalSupply, reserveA, reserveB]);

  // Check allowances
  const { data: allowanceA, refetch: refetchAllowanceA } = useReadContract({
    address: tokenA?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: account ? [account, CONTRACTS.ROUTER] : undefined,
    query: {
      enabled: !!account && !!tokenA && tokenA.address !== NATIVE_TOKEN.address,
    },
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useReadContract({
    address: tokenB?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: account ? [account, CONTRACTS.ROUTER] : undefined,
    query: {
      enabled: !!account && !!tokenB && tokenB.address !== NATIVE_TOKEN.address,
    },
  });

  const needsApprovalA = useMemo(() => {
    if (!tokenA || tokenA.address === NATIVE_TOKEN.address) return false;
    if (!parsedAmountA || parsedAmountA === BigInt(0)) return false;
    if (allowanceA === undefined) return false; // Still loading
    return allowanceA < parsedAmountA;
  }, [tokenA, allowanceA, parsedAmountA]);

  const needsApprovalB = useMemo(() => {
    if (!tokenB || tokenB.address === NATIVE_TOKEN.address) return false;
    if (!parsedAmountB || parsedAmountB === BigInt(0)) return false;
    if (allowanceB === undefined) return false; // Still loading
    return allowanceB < parsedAmountB;
  }, [tokenB, allowanceB, parsedAmountB]);

  // Contract writes
  const {
    writeContract: writeApproveA,
    data: approveHashA,
    isPending: isApprovePendingA,
  } = useWriteContract();

  const {
    writeContract: writeApproveB,
    data: approveHashB,
    isPending: isApprovePendingB,
  } = useWriteContract();

  const {
    writeContract: writeAddLiquidity,
    data: addLiquidityHash,
    isPending: isAddPending,
  } = useWriteContract();

  const { isLoading: isApproveConfirmingA, isSuccess: isApproveSuccessA } = useWaitForTransactionReceipt({
    hash: approveHashA,
  });

  const { isLoading: isApproveConfirmingB, isSuccess: isApproveSuccessB } = useWaitForTransactionReceipt({
    hash: approveHashB,
  });

  const { isLoading: isAddConfirming, isSuccess: isAddSuccess } = useWaitForTransactionReceipt({
    hash: addLiquidityHash,
  });

  // Handle successful approval transactions
  useEffect(() => {
    if (isApproveSuccessA && approveHashA) {
      // Refetch allowance to update UI state with retry logic
      const doRefetch = async () => {
        // Wait a bit for blockchain state to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        let result = await refetchAllowanceA();

        // If still undefined, retry after another delay
        if (!result.data || result.data === BigInt(0)) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await refetchAllowanceA();
        }
      };
      doRefetch();
    }
  }, [isApproveSuccessA, approveHashA, refetchAllowanceA]);

  useEffect(() => {
    if (isApproveSuccessB && approveHashB) {
      // Refetch allowance to update UI state with retry logic
      const doRefetch = async () => {
        // Wait a bit for blockchain state to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        let result = await refetchAllowanceB();

        // If still undefined, retry after another delay
        if (!result.data || result.data === BigInt(0)) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await refetchAllowanceB();
        }
      };
      doRefetch();
    }
  }, [isApproveSuccessB, approveHashB, refetchAllowanceB]);

  const approveA = useCallback(async () => {
    if (!tokenA || !account) return;
    setError(null);

    try {
      writeApproveA({
        address: tokenA.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACTS.ROUTER, parsedAmountA],
      });
    } catch (err: any) {
      setError(err?.message || "Approval failed");
    }
  }, [tokenA, account, parsedAmountA, writeApproveA]);

  const approveB = useCallback(async () => {
    if (!tokenB || !account) return;
    setError(null);

    try {
      writeApproveB({
        address: tokenB.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACTS.ROUTER, parsedAmountB],
      });
    } catch (err: any) {
      setError(err?.message || "Approval failed");
    }
  }, [tokenB, account, parsedAmountB, writeApproveB]);

  const addLiquidity = useCallback(async () => {
    if (!tokenA || !tokenB || !account || !liquidityQuote) return;
    setError(null);

    const txDeadline = getDeadline(deadline);
    
    // Calculate minimum amounts with slippage
    const amountAMin = (parsedAmountA * BigInt(10000 - slippageTolerance)) / BigInt(10000);
    const amountBMin = (parsedAmountB * BigInt(10000 - slippageTolerance)) / BigInt(10000);

    try {
      const isANative = tokenA.address === NATIVE_TOKEN.address;
      const isBNative = tokenB.address === NATIVE_TOKEN.address;

      if (isANative || isBNative) {
        const token = isANative ? tokenB : tokenA;
        const tokenAmount = isANative ? parsedAmountB : parsedAmountA;
        const tokenMin = isANative ? amountBMin : amountAMin;
        const ethAmount = isANative ? parsedAmountA : parsedAmountB;
        const ethMin = isANative ? amountAMin : amountBMin;

        writeAddLiquidity({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: "addLiquidityETH",
          args: [token.address, tokenAmount, tokenMin, ethMin, account, txDeadline],
          value: ethAmount,
          gas: BigInt(5000000),
        });
      } else {
        writeAddLiquidity({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: "addLiquidity",
          args: [
            tokenA.address,
            tokenB.address,
            parsedAmountA,
            parsedAmountB,
            amountAMin,
            amountBMin,
            account,
            txDeadline,
          ],
          gas: BigInt(5000000),
        });
      }

      if (addLiquidityHash) {
        addTransaction({
          hash: addLiquidityHash,
          type: "add_liquidity",
          summary: `Add ${tokenA.symbol}/${tokenB.symbol} liquidity`,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Add liquidity failed");
    }
  }, [
    tokenA,
    tokenB,
    account,
    liquidityQuote,
    deadline,
    slippageTolerance,
    parsedAmountA,
    parsedAmountB,
    writeAddLiquidity,
    addLiquidityHash,
    addTransaction,
  ]);

  return {
    quote: liquidityQuote,
    isLoading: reservesLoading,
    exists,
    reserveA,
    reserveB,
    totalSupply,
    needsApprovalA,
    needsApprovalB,
    isApproving: isApprovePendingA || isApprovePendingB || isApproveConfirmingA || isApproveConfirmingB,
    isAdding: isAddPending || isAddConfirming,
    isSuccess: isAddSuccess,
    approveA,
    approveB,
    addLiquidity,
    error,
    calculateAmountB,
    calculateAmountA,
  };
}
