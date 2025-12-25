import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { Header, Footer } from "@/components/layout";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Phasor | Decentralized Exchange on Monad",
  description:
    "Swap tokens, provide liquidity, and earn on the fastest DEX on Monad.",
  keywords: ["DEX", "Monad", "DeFi", "Swap", "Liquidity", "AMM"],
  openGraph: {
    title: "Phasor | Decentralized Exchange on Monad",
    description:
      "Swap tokens, provide liquidity, and earn on the fastest DEX on Monad.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} min-h-screen flex flex-col`}
      >
        <Providers>
          {/* Background Effects */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="gradient-orb gradient-orb-1" />
            <div className="gradient-orb gradient-orb-2" />
            <div className="noise fixed inset-0" />
          </div>

          <Header />
          <main className="flex-1 relative">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
