"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton
} from "@/components/ui/resizable-navbar";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { name: "Swap", link: "/swap" },
  { name: "Pools", link: "/pools" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Navbar className="top-0">
      {/* Desktop Navigation */}
      <NavBody>
        {/* Logo */}
        <Link href="/" className="relative z-20 flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 rounded-xl bg-phasor-gradient flex items-center justify-center shadow-glow">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-display font-bold text-gradient">Phasor</span>
        </Link>

        {/* Nav Items */}
        <NavItems items={NAV_ITEMS} />

        {/* Connect Wallet */}
        <div className="relative z-20">
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
                        <NavbarButton
                          as="button"
                          onClick={openConnectModal}
                          variant="gradient"
                          className="bg-phasor-gradient"
                        >
                          Connect Wallet
                        </NavbarButton>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <Button
                          onClick={openChainModal}
                          variant="destructive"
                          size="sm"
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
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                              <Image
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                width={16}
                                height={16}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="text-xs">{chain.name}</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <div className="w-4 h-4 rounded-full bg-phasor-gradient shrink-0" />
                          <span className="text-xs">{account.displayName}</span>
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-phasor-gradient flex items-center justify-center shadow-glow">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-display font-bold text-gradient">Phasor</span>
          </Link>
          <MobileNavToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </MobileNavHeader>

        <MobileNavMenu isOpen={isOpen} onClose={() => setIsOpen(false)}>
          {NAV_ITEMS.map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              className="text-neutral-600 dark:text-neutral-300 hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              {item.name}
            </a>
          ))}

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
                <div className="w-full">
                  {(() => {
                    if (!connected) {
                      return (
                        <Button
                          onClick={openConnectModal}
                          className="w-full bg-phasor-500 text-surface-0 hover:bg-phasor-400"
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
                          className="w-full"
                        >
                          Wrong network
                        </Button>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          onClick={openChainModal}
                          variant="outline"
                          className="w-full flex items-center gap-2"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                              <Image
                                alt={chain.name ?? "Chain icon"}
                                src={chain.iconUrl}
                                width={16}
                                height={16}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <span className="text-xs">{chain.name}</span>
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full flex items-center gap-2"
                        >
                          <div className="w-4 h-4 rounded-full bg-phasor-gradient shrink-0" />
                          <span className="text-xs">{account.displayName}</span>
                        </Button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
