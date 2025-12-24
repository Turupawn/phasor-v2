import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { monad } from "./chains";

// ============================================
// WAGMI + RAINBOWKIT CONFIGURATION
// ============================================

export const config = getDefaultConfig({
  appName: "Phasor",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || "YOUR_PROJECT_ID", // TODO: Get from WalletConnect Cloud
  chains: [monad],
  ssr: true,
});

// Re-export everything from chains
export * from "./chains";
export * from "./abis";
