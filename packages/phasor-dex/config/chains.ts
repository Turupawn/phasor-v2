import { defineChain } from "viem";
import { Address } from "viem";

// ============================================
// MONAD CHAIN CONFIGURATION
// ============================================
// TODO: Update these values with actual Monad chain details

export const monad = defineChain({
  id: Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID) || 143, // TODO: Replace with actual Monad chain ID
  name: "Monad",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON", // TODO: Confirm native token symbol
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_DEFAULT_RPC_URL || "http://127.0.0.1:8545"], // TODO: Replace with actual RPC
      webSocket: ["wss://ws.monad.xyz"], // TODO: Replace with actual WS
    },
    public: {
      http: [process.env.NEXT_PUBLIC_DEFAULT_RPC_URL || "http://127.0.0.1:8545"], // TODO: Replace with actual RPC
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
  FACTORY: process.env.NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS as Address,
  ROUTER: process.env.NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS as Address,

  // Wrapped MON (WMON) address
  WMON: (process.env.NEXT_PUBLIC_DEFAULT_WMON_ADDRESS || "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701") as Address,
} as const;

// Debug logging
if (typeof window !== 'undefined') {
  console.log('[CONTRACTS] Configuration:', {
    FACTORY: CONTRACTS.FACTORY,
    ROUTER: CONTRACTS.ROUTER,
    WMON: CONTRACTS.WMON,
    RPC_URL: process.env.NEXT_PUBLIC_DEFAULT_RPC_URL,
    ENV_VARS: {
      FACTORY_ENV: process.env.NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS,
      ROUTER_ENV: process.env.NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS,
      RPC_ENV: process.env.NEXT_PUBLIC_DEFAULT_RPC_URL,
    }
  });
}

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
    tags: (token as any).tags || [],
  }));

// Native token representation (for UI)
export const NATIVE_TOKEN: Token = {
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, //TODO: CHANGE THIS TO ZERO ADDRESS
      name: "Monad",
      symbol: "MON",
      decimals: 18,
      logoURI: "https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/MON/logo.svg"
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
