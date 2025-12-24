import { defineChain } from "viem";
import { Address } from "viem";

// ============================================
// MONAD CHAIN CONFIGURATION
// ============================================
// TODO: Update these values with actual Monad chain details

export const monad = defineChain({
  id: 10143, // TODO: Replace with actual Monad chain ID
  name: "Monad",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON", // TODO: Confirm native token symbol
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"], // TODO: Replace with actual RPC
      webSocket: ["wss://ws.monad.xyz"], // TODO: Replace with actual WS
    },
    public: {
      http: ["https://rpc.monad.xyz"], // TODO: Replace with actual RPC
      webSocket: ["wss://ws.monad.xyz"], // TODO: Replace with actual WS
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://explorer.monad.xyz", // TODO: Replace with actual explorer
    },
  },
  testnet: false, // TODO: Set based on network
});

// ============================================
// CONTRACT ADDRESSES
// ============================================
// TODO: Replace with your deployed contract addresses

export const CONTRACTS = {
  // Core Uniswap V2 contracts - from environment variables
  FACTORY: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS) as Address,
  ROUTER: (process.env.NEXT_PUBLIC_ROUTER_ADDRESS) as Address,

  // Common tokens
  WMON: "0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541" as Address, // Wrapped MON
  USDC: "0xAA292E8611aDF267e563f334Ee42320aC96D0463" as Address,
  USDT: "0x5c74c94173F05dA1720953407cbb920F3DF9f887" as Address,

  // Test tokens from Cannon deployment - from environment variables
  TKN1: (process.env.NEXT_PUBLIC_TKN1_ADDRESS || "0x6F6f570F45833E249e27022648a26F4076F48f78") as Address,
  TKN2: (process.env.NEXT_PUBLIC_TKN2_ADDRESS || "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9") as Address,
} as const;

// ============================================
// DEFAULT TOKENS LIST (from token list standard)
// ============================================

import { Token } from "@/types";
import tokenList from "@/public/tokenlist.json";

// Load tokens from the token list JSON file
// Filters by current chain ID (10143 for Monad testnet)
export const DEFAULT_TOKENS: Token[] = tokenList.tokens
  .filter((token) => token.chainId === monad.id)
  .map((token) => ({
    address: token.address as Address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
    tags: token.tags,
  }));

// Native token representation (for UI)
export const NATIVE_TOKEN: Token = {
  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address,
  symbol: "MON",
  name: "Monad",
  decimals: 18,
  logoURI: "/tokens/mon.svg",
};

// ============================================
// DEX SETTINGS
// ============================================

export const DEX_SETTINGS = {
  // Default slippage tolerance in basis points (50 = 0.5%)
  DEFAULT_SLIPPAGE: 50,
  
  // Default transaction deadline in minutes
  DEFAULT_DEADLINE: 20,
  
  // Uniswap V2 fee (0.3%)
  SWAP_FEE_BPS: 30,
  
  // Minimum liquidity locked forever (Uniswap V2)
  MINIMUM_LIQUIDITY: BigInt(1000),
} as const;
