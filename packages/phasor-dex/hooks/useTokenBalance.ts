import { useReadContract, useBalance, useAccount } from "wagmi";
import { Address, erc20Abi } from "viem";
import { Token } from "@/types";
import { NATIVE_TOKEN } from "@/config";

interface UseTokenBalanceResult {
  balance: bigint;
  formatted: string;
  isLoading: boolean;
  refetch: () => void;
}

export function useTokenBalance(token: Token | null): UseTokenBalanceResult {
  const { address: account } = useAccount();
  
  const isNative = token?.address === NATIVE_TOKEN.address;
  
  // Native balance
  const {
    data: nativeBalance,
    isLoading: nativeLoading,
    refetch: refetchNative,
  } = useBalance({
    address: account,
    query: {
      enabled: !!account && isNative,
    },
  });
  
  // ERC20 balance
  const {
    data: tokenBalance,
    isLoading: tokenLoading,
    refetch: refetchToken,
  } = useReadContract({
    address: token?.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: {
      enabled: !!account && !!token && !isNative,
    },
  });
  
  if (!token || !account) {
    return {
      balance: BigInt(0),
      formatted: "0",
      isLoading: false,
      refetch: () => {},
    };
  }
  
  if (isNative) {
    return {
      balance: nativeBalance?.value ?? BigInt(0),
      formatted: nativeBalance?.formatted ?? "0",
      isLoading: nativeLoading,
      refetch: refetchNative,
    };
  }
  
  return {
    balance: tokenBalance ?? BigInt(0),
    formatted: tokenBalance ? String(tokenBalance) : "0",
    isLoading: tokenLoading,
    refetch: refetchToken,
  };
}

// Hook to get multiple token balances
export function useTokenBalances(tokens: Token[]): Map<Address, bigint> {
  const { address: account } = useAccount();
  const balances = new Map<Address, bigint>();
  
  // This is a simplified version - in production you'd use multicall
  tokens.forEach((token) => {
    const { balance } = useTokenBalance(token);
    balances.set(token.address, balance);
  });
  
  return balances;
}
