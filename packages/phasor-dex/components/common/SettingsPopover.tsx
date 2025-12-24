"use client";

import React from "react";
import { Settings } from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SLIPPAGE_PRESETS = [10, 50, 100]; // 0.1%, 0.5%, 1%

export function SettingsPopover() {
  const {
    slippageTolerance,
    deadline,
    setSlippageTolerance,
    setDeadline,
  } = useSettingsStore();

  const [customSlippage, setCustomSlippage] = React.useState("");

  const handleSlippagePreset = (value: number) => {
    setSlippageTolerance(value);
    setCustomSlippage("");
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 50) {
      setSlippageTolerance(Math.round(parsed * 100)); // Convert % to bps
    }
  };

  const isCustom = !SLIPPAGE_PRESETS.includes(slippageTolerance);
  const displaySlippage = slippageTolerance / 100;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-surface-3 rounded-xl"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Transaction Settings</h4>

          {/* Slippage Tolerance */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Slippage Tolerance
            </label>
            <div className="flex gap-2">
              {SLIPPAGE_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  variant={slippageTolerance === preset ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSlippagePreset(preset)}
                  className="flex-1"
                >
                  {preset / 100}%
                </Button>
              ))}
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder="Custom"
                  value={isCustom ? displaySlippage : customSlippage}
                  onChange={(e) => handleCustomSlippage(e.target.value)}
                  className={cn(
                    "pr-8 h-9",
                    isCustom && "border-phasor-500/50"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            {slippageTolerance > 100 && (
              <p className="text-xs text-yellow-500">
                High slippage tolerance. Your transaction may be frontrun.
              </p>
            )}
          </div>

          {/* Transaction Deadline */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              Transaction Deadline
            </label>
            <div className="relative">
              <Input
                type="number"
                value={deadline}
                onChange={(e) => setDeadline(Number(e.target.value))}
                className="pr-16"
                min={1}
                max={60}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                minutes
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
