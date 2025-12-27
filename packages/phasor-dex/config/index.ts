import "@/lib/polyfills";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monad } from "./chains";

// ============================================
// WAGMI + RAINBOWKIT CONFIGURATION
// ============================================

export const config = getDefaultConfig({
  appName: "Phasor",
  projectId: process.env.NEXT_PUBLIC_DEFAULT_WALLET_CONNECT_ID || "YOUR_PROJECT_ID", // TODO: Get from WalletConnect Cloud
  chains: [monad],
  ssr: false, // Disable SSR to avoid indexedDB errors during build
});

// Re-export everything from chains
export * from "./chains";
export * from "./abis";
