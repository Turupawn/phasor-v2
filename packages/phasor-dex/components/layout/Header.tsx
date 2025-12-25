"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/swap", label: "Swap" },
  { href: "/pools", label: "Pools" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-4/50 bg-surface-1/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-phasor-gradient flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow">
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <span className="text-xl font-display font-bold text-gradient">
            Phasor
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-3 rounded-xl p-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === item.href || (pathname === "/" && item.href === "/swap")
                  ? "bg-surface-4 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-4/50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Connect Wallet */}
        <div className="flex items-center gap-3">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <Button
                          onClick={openConnectModal}
                          className="px-5 py-2.5 bg-phasor-500 text-surface-0 hover:bg-phasor-400 shadow-glow hover:shadow-glow-lg"
                        >
                          Connect Wallet
                        </Button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button
                          onClick={openChainModal}
                          variant="destructive"
                        >
                          Wrong network
                        </Button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={openChainModal}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {chain.hasIcon && (
                            <div className="w-5 h-5 rounded-full overflow-hidden">
                              {chain.iconUrl && (
                                <Image
                                  alt={chain.name ?? "Chain icon"}
                                  src={chain.iconUrl}
                                  width={20}
                                  height={20}
                                  className="object-cover"
                                />
                              )}
                            </div>
                          )}
                          <span className="text-sm font-medium hidden sm:inline">
                            {chain.name}
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <div className="w-5 h-5 rounded-full bg-phasor-gradient" />
                          <span className="text-sm font-medium">
                            {account.displayName}
                          </span>
                          {account.displayBalance && (
                            <span className="text-sm text-muted-foreground hidden sm:inline">
                              {account.displayBalance}
                            </span>
                          )}
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
