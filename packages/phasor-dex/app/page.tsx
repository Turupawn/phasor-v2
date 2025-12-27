import { SwapCard } from "@/components/swap";
import { WavyBackground } from "@/components/ui/wavy-background";
import { FocusCards } from "@/components/ui/focus-cards";

const focusCards = [
  {
    title: "Lightning Fast Swaps",
    src: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop",
  },
  {
    title: "Deep Liquidity Pools",
    src: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&auto=format&fit=crop",
  },
  {
    title: "Powered by Monad",
    src: "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <>
      <WavyBackground className="w-full" backgroundFill="hsl(0, 0%, 7%)">
        <div className="container py-8 md:py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            {/* Hero Text */}
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold">
                Swap at the Speed of Light
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
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">Total Volume</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground">Total Liquidity</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Trading Pairs</p>
              </div>
            </div>
          </div>
        </div>
      </WavyBackground>

      {/* Focus Cards Section */}
      <section className="w-full bg-background py-16 md:py-24">
        <div className="container">
          <FocusCards cards={focusCards} />
        </div>
      </section>
    </>
  );
}
