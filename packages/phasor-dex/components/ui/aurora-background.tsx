"use client";

import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function AuroraBackground({ children, className }: AuroraBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden", className)}>
      {/* Aurora Effect */}
      <div className="aurora-container">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
