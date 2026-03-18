import {
  AppleLogo,
  GooglePlayLogo,
  User,
  DeviceMobile,
  BookOpen,
  Coins,
  TwitterLogo,
  DiscordLogo,
} from "@phosphor-icons/react/dist/ssr";
import PhoneMockup from "@/components/PhoneMockup";

export default function Home() {
  return (
    <>
      {/* Nav */}
      <nav className="w-full border-b border-[#ffffff10] bg-[#000000]/80 backdrop-blur-xl z-50 sticky top-0">
        <div className="max-w-[1440px] mx-auto px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[#f4f4f5] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#000000] rounded-full" />
            </div>
            <span className="text-base font-medium tracking-tight text-[#f4f4f5]">
              Midnight
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10 font-sans text-xs font-medium">
            <a
              href="#how-it-works"
              className="text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
            >
              Protocol
            </a>
            <a
              href="#markets"
              className="text-[#a1a1aa] hover:text-[#f4f4f5] transition-colors"
            >
              Markets
            </a>
            <a
              href="#download"
              className="bg-[#f4f4f5] text-[#000000] px-5 py-2 rounded-full hover:bg-white transition-colors"
            >
              Get App
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="w-full relative overflow-hidden bg-[#000000] border-b border-[#ffffff10] min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-glow-top opacity-100 pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-8 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          {/* Left */}
          <div className="lg:col-span-7 flex flex-col gap-10">
            <div className="inline-flex items-center gap-3 bg-transparent py-2 w-max">
              <span className="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full animate-pulse-slow" />
              <span className="font-mono text-[9px] font-normal uppercase tracking-[0.2em] text-[#a1a1aa]">
                Live on Solana Mainnet
              </span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-[100px] font-medium tracking-tight leading-[1] text-[#f4f4f5]">
              Read <span className="text-[#888888]">less.</span>
              <br />
              Predict <span className="text-[#f4f4f5]">more.</span>
            </h1>

            <p className="font-mono text-[10px] sm:text-[11px] text-[#888888] max-w-md leading-[2.2] tracking-[0.15em] uppercase border-none pl-0 py-2 mt-4">
              Crypto and AI alpha distilled to the absolute essentials. Read the
              facts in seconds. Place informed bets instantly on outcomes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="#download"
                className="bg-[#f4f4f5] text-[#000000] font-sans font-medium text-sm py-4 px-8 rounded-full hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                <AppleLogo weight="fill" className="text-lg" />
                App Store
              </a>
              <a
                href="#download"
                className="bg-transparent border border-[#ffffff20] text-[#f4f4f5] font-sans font-medium text-sm py-4 px-8 rounded-full hover:bg-[#ffffff05] transition-all flex items-center justify-center gap-2"
              >
                <GooglePlayLogo weight="fill" className="text-lg" />
                Google Play
              </a>
            </div>

            <div className="flex items-center gap-4 mt-8 font-mono text-[9px] text-[#888888] uppercase tracking-[0.15em]">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border border-[#111111] bg-[#222222] flex items-center justify-center text-[#888888] text-xs">
                  <User weight="fill" />
                </div>
                <div className="w-8 h-8 rounded-full border border-[#111111] bg-[#333333] flex items-center justify-center text-[#888888] text-xs">
                  <User weight="fill" />
                </div>
                <div className="w-8 h-8 rounded-full border border-[#111111] bg-[#444444] flex items-center justify-center text-[#888888] text-xs">
                  <User weight="fill" />
                </div>
              </div>
              <div>
                <span className="text-[#f4f4f5]">50K+</span> Traders already
                predicting
              </div>
            </div>
          </div>

          {/* Right — Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center relative mt-20 lg:mt-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] bg-glow-center opacity-60 blur-[100px] rounded-full pointer-events-none" />

            <PhoneMockup />

            <div className="absolute top-1/4 -right-8 lg:-right-16 bg-[#111111]/80 backdrop-blur-md border border-[#ffffff15] px-6 py-2.5 rounded-full font-mono text-[9px] uppercase tracking-widest text-[#f4f4f5] z-10 hidden md:block">
              $SOL <span className="text-[#a1a1aa] ml-2">+4.2%</span>
            </div>
            <div className="absolute bottom-1/4 -left-8 lg:-left-16 bg-[#111111]/80 backdrop-blur-md border border-[#ffffff15] px-6 py-2.5 rounded-full font-mono text-[9px] uppercase tracking-widest text-[#f4f4f5] z-30 hidden md:block">
              AI Index Active
            </div>
          </div>
        </div>
      </header>

      {/* Marquee */}
      <div className="w-full bg-[#000000] py-6 overflow-hidden flex whitespace-nowrap border-b border-[#ffffff10] relative z-20">
        <div className="flex animate-marquee font-mono text-[10px] text-[#555555] tracking-[0.2em] uppercase">
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">60-WORD NEWS SUMMARIES</span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">
              NO FLUFF, JUST THE FACTS
            </span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">
              GET INFORMED IN SECONDS, NOT MINUTES
            </span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">PLACE INFORMED BETS</span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">BUILT ON SOLANA</span>
          </span>
        </div>
        <div className="flex animate-marquee font-mono text-[10px] text-[#555555] tracking-[0.2em] uppercase absolute top-6 left-[100%]">
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">60-WORD NEWS SUMMARIES</span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">
              NO FLUFF, JUST THE FACTS
            </span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">
              GET INFORMED IN SECONDS, NOT MINUTES
            </span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">PLACE INFORMED BETS</span>
          </span>
          <span className="mx-12 text-[#333333]">
            •{" "}
            <span className="text-[#888888] ml-4">BUILT ON SOLANA</span>
          </span>
        </div>
      </div>

      {/* How it Works */}
      <section
        id="how-it-works"
        className="w-full bg-[#000000] py-40 border-b border-[#ffffff10] relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-8 relative z-10">
          <div className="mb-24 flex flex-col md:flex-row justify-between items-end gap-8">
            <h2 className="text-5xl md:text-6xl font-medium tracking-tight text-[#f4f4f5] leading-[1]">
              How it works
            </h2>
            <p className="font-mono text-[10px] text-[#888888] tracking-[0.15em] uppercase border-none pl-0 pb-2 max-w-xs">
              Maximum Information. Minimum Time. The protocol for modern traders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-transparent border-none">
            {/* Step 1 */}
            <div className="p-12 bg-[#ffffff03] border border-[#ffffff0a] rounded-3xl relative group hover:bg-[#ffffff05] transition-colors duration-300 overflow-hidden">
              <div className="absolute top-10 right-10 text-[10px] font-mono text-[#555555] uppercase tracking-widest">
                No. 01
              </div>
              <div className="relative z-10 flex flex-col h-full mt-10">
                <div className="w-12 h-12 rounded-full border border-[#ffffff10] bg-transparent text-[#f4f4f5] flex items-center justify-center mb-12 shadow-none">
                  <DeviceMobile className="text-xl" />
                </div>
                <h3 className="text-2xl font-medium text-[#f4f4f5] mb-6 tracking-tight">
                  Open &amp; Swipe
                </h3>
                <p className="text-[#888888] font-mono text-[10px] uppercase tracking-[0.15em] leading-[2.2] border-none pl-0 mt-auto">
                  Dive into a vertical feed of ultra-concise news. Swipe up to
                  move to the next story instantly. No loading, no waiting.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-12 bg-[#ffffff03] border border-[#ffffff0a] rounded-3xl relative group hover:bg-[#ffffff05] transition-colors duration-300 overflow-hidden">
              <div className="absolute top-10 right-10 text-[10px] font-mono text-[#555555] uppercase tracking-widest">
                No. 02
              </div>
              <div className="relative z-10 flex flex-col h-full mt-10">
                <div className="w-12 h-12 rounded-full border border-[#ffffff10] bg-transparent text-[#f4f4f5] flex items-center justify-center mb-12 shadow-none">
                  <BookOpen className="text-xl" />
                </div>
                <h3 className="text-2xl font-medium text-[#f4f4f5] mb-6 tracking-tight">
                  Read 60 Words
                </h3>
                <p className="text-[#888888] font-mono text-[10px] uppercase tracking-[0.15em] leading-[2.2] border-none pl-0 mt-auto">
                  No fluff, no filler. Just the critical information you need
                  regarding Crypto and AI, curated by experts. Read the facts in
                  seconds.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-12 bg-[#ffffff03] border border-[#ffffff0a] rounded-3xl relative group hover:bg-[#ffffff05] transition-colors duration-300 overflow-hidden">
              <div className="absolute top-10 right-10 text-[10px] font-mono text-[#555555] uppercase tracking-widest">
                No. 03
              </div>
              <div className="relative z-10 flex flex-col h-full mt-10">
                <div className="w-12 h-12 rounded-full border border-[#ffffff10] bg-transparent text-[#f4f4f5] flex items-center justify-center mb-12 shadow-none">
                  <Coins className="text-xl" />
                </div>
                <h3 className="text-2xl font-medium text-[#f4f4f5] mb-6 tracking-tight">
                  Place Bets
                </h3>
                <p className="text-[#888888] font-mono text-[10px] uppercase tracking-[0.15em] leading-[2.2] border-none pl-0 mt-auto">
                  Turn knowledge into action. Tap YES or NO to place informed
                  bets on story outcomes using prediction markets built directly
                  on Solana.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section
        id="download"
        className="w-full bg-[#000000] border-b border-[#ffffff10] py-40 px-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-glow-bottom opacity-80 pointer-events-none" />

        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center relative z-10">
          <div className="mb-10 flex items-center gap-3 bg-transparent border-none px-0 py-0 shadow-none">
            <span className="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a1a1aa]">
              Join 50,000+ Traders
            </span>
          </div>

          <h2 className="text-6xl md:text-8xl font-medium tracking-tight text-[#f4f4f5] leading-[1] mb-8">
            Stop reading.
            <br />
            <span className="text-[#888888]">
              Start
              <br />
              betting.
            </span>
          </h2>

          <p className="font-mono text-[10px] text-[#888888] max-w-md leading-[2] tracking-[0.15em] uppercase mb-16">
            The alpha is waiting. Download Midnight to get informed in seconds
            and trade on pure signal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
            <button className="flex-1 bg-[#f4f4f5] text-[#000000] font-sans font-medium text-sm py-4 px-6 rounded-full hover:bg-white transition-all flex items-center justify-center gap-3 border-none shadow-none">
              <AppleLogo weight="fill" className="text-xl" />
              <div className="flex flex-col items-start text-left leading-none">
                <span className="font-mono text-[8px] tracking-[0.15em] text-[#555555] mb-0.5 uppercase">
                  Download on the
                </span>
                <span>App Store</span>
              </div>
            </button>
            <button className="flex-1 bg-transparent border border-[#ffffff20] text-[#f4f4f5] font-sans font-medium text-sm py-4 px-6 rounded-full hover:bg-[#ffffff05] transition-all flex items-center justify-center gap-3 shadow-none">
              <GooglePlayLogo weight="fill" className="text-xl" />
              <div className="flex flex-col items-start text-left leading-none">
                <span className="font-mono text-[8px] tracking-[0.15em] text-[#888888] mb-0.5 uppercase">
                  GET IT ON
                </span>
                <span>Google Play</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#000000] pt-24 pb-12 border-none">
        <div className="max-w-[1440px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-6 h-6 rounded-full bg-[#f4f4f5] flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-[#000000] rounded-full" />
                </div>
                <span className="text-lg font-medium tracking-tight text-[#f4f4f5]">
                  Midnight
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#555555] max-w-xs mb-8 uppercase tracking-[0.15em] leading-[2.2]">
                Maximum information. Minimum time. The protocol for the modern
                trader.
              </p>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full border border-[#ffffff10] flex items-center justify-center text-[#888888] hover:text-[#f4f4f5] hover:bg-[#ffffff05] transition-colors bg-transparent"
                >
                  <TwitterLogo weight="fill" className="text-lg" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full border border-[#ffffff10] flex items-center justify-center text-[#888888] hover:text-[#f4f4f5] hover:bg-[#ffffff05] transition-colors bg-transparent"
                >
                  <DiscordLogo weight="fill" className="text-lg" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-sans text-xs font-medium text-[#a1a1aa] mb-6">
                Protocol
              </h4>
              <ul className="flex flex-col gap-3 font-sans text-sm text-[#f4f4f5]">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#a1a1aa] transition-colors"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#a1a1aa] transition-colors"
                  >
                    Markets
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#a1a1aa] transition-colors"
                  >
                    Leaderboard
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#a1a1aa] transition-colors"
                  >
                    Download
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-sans text-xs font-medium text-[#a1a1aa] mb-6">
                Legal
              </h4>
              <ul className="flex flex-col gap-3 font-sans text-sm text-[#f4f4f5]">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#a1a1aa] transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#a1a1aa] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#a1a1aa] transition-colors"
                  >
                    Risk Disclosure
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#ffffff10] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[9px] text-[#555555] uppercase tracking-[0.2em]">
            <div className="flex items-center gap-3">
              <span>&copy; 2024 Midnight Tech. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-2 text-[#888888]">
              <div className="w-1.5 h-1.5 bg-[#f4f4f5] rounded-full opacity-50" />
              Systems Operational
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
