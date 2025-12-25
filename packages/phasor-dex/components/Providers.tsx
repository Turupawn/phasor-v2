"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { Toaster } from "sonner";
import { config } from "@/config";

import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

// Custom RainbowKit theme matching Phasor branding
const phasorTheme = darkTheme({
  accentColor: "#00d9ff",
  accentColorForeground: "#0a0a0f",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

// Override additional theme properties
const customTheme = {
  ...phasorTheme,
  colors: {
    ...phasorTheme.colors,
    modalBackground: "#12121a",
    modalBorder: "#22222e",
    profileForeground: "#12121a",
  },
  shadows: {
    ...phasorTheme.shadows,
    dialog: "0 0 40px rgba(0, 217, 255, 0.15)",
  },
};

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={customTheme}
          modalSize="compact"
          appInfo={{
            appName: "Phasor",
            learnMoreUrl: "https://phasor.exchange",
          }}
        >
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: 'hsl(240 10% 6%)',
                border: '1px solid hsl(240 5% 18%)',
                color: 'hsl(0 0% 98%)',
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
