import { Suspense } from "react";
import { SwapCard } from "@/components/swap";
import { Skeleton } from "@/components/ui/skeleton";

function SwapCardLoading() {
  return (
    <div className="w-full max-w-[320px] space-y-4">
      <Skeleton className="h-8 w-20 bg-white/10" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-xl" />
      <Skeleton className="h-32 w-full bg-white/10 rounded-xl" />
      <Skeleton className="h-12 w-full bg-white/10 rounded-lg" />
    </div>
  );
}

export default function SwapPage() {
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header Section - Top Left */}
      <div className="mb-4">
        <span className="text-[#614bdf] text-xs font-mono">// SWAP</span>
        <h1 className="text-base font-display font-medium text-white leading-none">
          Swap at the Speed of Light
        </h1>
      </div>

      {/* Swap Card - Centered horizontally, above center vertically */}
      <div className="flex-1 flex items-center justify-center -mt-40">
        <Suspense fallback={<SwapCardLoading />}>
          <SwapCard />
        </Suspense>
      </div>
    </div>
  );
}
