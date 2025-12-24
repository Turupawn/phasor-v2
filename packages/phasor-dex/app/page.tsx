import { SwapCard } from "@/components/swap";

export default function Home() {
  return (
    <div className="container py-8 md:py-16">
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
        {/* Hero Text */}
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
            Swap at the{" "}
            <span className="text-gradient">Speed of Light</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            The premier decentralized exchange on Monad. Lightning-fast swaps,
            deep liquidity, and the best rates.
          </p>
        </div>

        {/* Swap Card */}
        <SwapCard />

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-8">
          <div className="text-center">
            <p className="text-3xl font-bold text-gradient">$0</p>
            <p className="text-sm text-muted-foreground">Total Volume</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gradient">$0</p>
            <p className="text-sm text-muted-foreground">Total Liquidity</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gradient">0</p>
            <p className="text-sm text-muted-foreground">Trading Pairs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
