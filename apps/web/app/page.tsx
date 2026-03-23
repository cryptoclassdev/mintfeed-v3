import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  FeedPhoneMockup,
  PredictionPhoneMockup,
  MarketPhoneMockup,
} from "@/components/PhoneMockupLight";
import FAQ from "@/components/FAQ";
import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* ─── Hero Section ─── */}
      <section className="relative w-full overflow-hidden pt-16 pb-8 md:pt-24 md:pb-16">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-[10%] w-[300px] h-[300px] rounded-full bg-[#FDDDD5]/60 blur-[80px] pointer-events-none" />
        <div className="absolute top-40 right-[10%] w-[250px] h-[250px] rounded-full bg-[#D5F0E8]/60 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-20 left-[30%] w-[200px] h-[200px] rounded-full bg-[#D5E4F0]/40 blur-[80px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 md:px-8 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-8 fade-up">
            <div className="inline-flex items-center gap-2 bg-white border border-black/[0.06] rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 bg-[#00D4AA] rounded-full animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#666]">
                Live on Solana Mainnet
              </span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-2xl mx-auto mb-6 fade-up fade-up-d1">
            <h1 className="text-5xl md:text-7xl font-anton tracking-tight text-[#111] leading-[0.95]">
              Read less.
              <br />
              Predict more.
            </h1>
          </div>

          {/* Subheading */}
          <p className="text-center text-[#666] text-base md:text-lg leading-relaxed max-w-lg mx-auto mb-8 fade-up fade-up-d2">
            Midnight is a crypto news feed where every story is compressed to 60
            words. Swipe through, form a view, and place on-chain predictions.
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-16 fade-up fade-up-d3">
            <a
              href="https://form.typeform.com/to/lAIai6px"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#111] text-white font-sans font-medium text-sm px-8 py-3.5 rounded-full hover:bg-[#333] active:translate-y-px active:scale-[0.97] transition-all duration-150 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
            >
              Join Waitlist
            </a>
          </div>

          {/* Phone Mockups */}
          <div className="flex justify-center items-end gap-6 md:gap-10 fade-up fade-up-d4">
            <div className="phone-float hidden sm:block">
              <FeedPhoneMockup className="scale-90 md:scale-100" />
            </div>
            <div className="phone-float-delayed">
              <PredictionPhoneMockup className="scale-95 md:scale-105" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature Pills ─── */}
      <section id="features" className="w-full py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-[#F0F4FF] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#4C8BD0]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-[#111] mb-2">
                60-word stories
              </h3>
              <p className="text-sm text-[#888] leading-relaxed">
                Every article compressed to its essential facts. Only signal,
                zero fluff.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-[#EEFBF7] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#00D4AA]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-[#111] mb-2">
                On-chain predictions
              </h3>
              <p className="text-sm text-[#888] leading-relaxed">
                Read the headline, form a view, swipe YES or NO. All markets
                settle on Solana.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-[#FFF5EE] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#F7931A]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M14.5 9.5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2" />
                  <line x1="12" y1="6" x2="12" y2="7.5" />
                  <line x1="12" y1="16.5" x2="12" y2="18" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-[#111] mb-2">
                Real-time markets
              </h3>
              <p className="text-sm text-[#888] leading-relaxed">
                Track crypto prices with live data. Connect any Solana wallet —
                Phantom, Backpack, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works (3 detailed sections) ─── */}
      <section id="how-it-works" className="w-full py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#999] mb-3 block">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-anton tracking-tight text-[#111]">
              Crypto news,
              <br />
              distilled.
            </h2>
          </div>

          {/* Step 1 — Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 md:mb-32">
            <div className="order-2 lg:order-1 flex justify-center">
              <FeedPhoneMockup className="phone-float" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="font-mono text-[11px] text-[#4C8BD0] uppercase tracking-[0.2em] font-medium">
                  01 — Feed
                </span>
              </div>
              <h3 className="text-3xl md:text-4xl font-anton tracking-tight text-[#111] mb-4 leading-[0.95]">
                60-word
                <br />
                stories.
              </h3>
              <p className="text-[#666] text-base leading-relaxed max-w-md">
                Every article compressed to its essential facts. Only signal,
                zero fluff. Swipe up to the next story instantly.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-3 py-1.5 rounded-full bg-[#F0F4FF] text-[#4C8BD0] font-mono text-[10px] uppercase tracking-wider">
                  Crypto
                </span>
                <span className="px-3 py-1.5 rounded-full bg-[#F0F4FF] text-[#4C8BD0] font-mono text-[10px] uppercase tracking-wider">
                  AI
                </span>
                <span className="px-3 py-1.5 rounded-full bg-[#F0F4FF] text-[#4C8BD0] font-mono text-[10px] uppercase tracking-wider">
                  Swipe UX
                </span>
              </div>
            </div>
          </div>

          {/* Step 2 — Predict */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 md:mb-32">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="font-mono text-[11px] text-[#00D4AA] uppercase tracking-[0.2em] font-medium">
                  02 — Predict
                </span>
              </div>
              <h3 className="text-3xl md:text-4xl font-anton tracking-tight text-[#111] mb-4 leading-[0.95]">
                Swipe
                <br />
                to bet.
              </h3>
              <p className="text-[#666] text-base leading-relaxed max-w-md">
                Each story has a prediction market. Read the headline, form a
                view, swipe YES or NO. All markets settle on Solana.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 max-w-sm">
                <div>
                  <span className="font-mono text-[10px] text-[#999] uppercase tracking-wider block mb-1">
                    Volume
                  </span>
                  <span className="font-mono text-lg font-bold text-[#111]">
                    $2.4M
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#999] uppercase tracking-wider block mb-1">
                    Traders
                  </span>
                  <span className="font-mono text-lg font-bold text-[#111]">
                    3,847
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#999] uppercase tracking-wider block mb-1">
                    Markets
                  </span>
                  <span className="font-mono text-lg font-bold text-[#111]">
                    Live
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <PredictionPhoneMockup className="phone-float-delayed" />
            </div>
          </div>

          {/* Step 3 — Market */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <MarketPhoneMockup className="phone-float" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="font-mono text-[11px] text-[#4C8BD0] uppercase tracking-[0.2em] font-medium">
                  03 — Market
                </span>
              </div>
              <h3 className="text-3xl md:text-4xl font-anton tracking-tight text-[#111] mb-4 leading-[0.95]">
                All markets.
                <br />
                Real-time.
              </h3>
              <p className="text-[#666] text-base leading-relaxed max-w-md">
                Track crypto prices with live data. Connect any Solana wallet —
                Phantom, Backpack, Solflare, and more.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Bitcoin", "Ethereum", "Solana", "Sui", "Avalanche"].map(
                  (coin) => (
                    <span
                      key={coin}
                      className="px-3 py-1.5 rounded-full bg-white border border-black/[0.06] text-[#666] font-mono text-[10px] uppercase tracking-wider"
                    >
                      {coin}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Highlight / CTA Section (colored background, like coverage in design) ─── */}
      <section className="w-full py-20 md:py-28 bg-gradient-to-br from-[#FDF2EF] via-[#FEF8F5] to-[#F0F7F4] relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute top-10 right-[15%] w-[200px] h-[200px] rounded-full bg-[#FDDDD5]/30 blur-[60px] pointer-events-none" />
        <div className="absolute bottom-10 left-[10%] w-[180px] h-[180px] rounded-full bg-[#D5F0E8]/30 blur-[60px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 md:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#999] mb-3 block">
                Why Midnight
              </span>
              <h2 className="text-4xl md:text-5xl font-anton tracking-tight text-[#111] mb-6 leading-[0.95]">
                Your unfair
                <br />
                info advantage.
              </h2>
              <p className="text-[#666] text-base leading-relaxed max-w-md mb-8">
                Crypto and AI alpha distilled to the absolute essentials. Read
                the facts in seconds. Place informed bets instantly on outcomes.
              </p>
              <div className="space-y-4">
                {[
                  "Every story compressed to 60 words",
                  "On-chain prediction markets on Solana",
                  "Real-time crypto price tracking",
                  "Non-custodial — your keys, your bets",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#00D4AA]/15 flex items-center justify-center shrink-0">
                      <svg
                        className="w-3 h-3 text-[#00D4AA]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-sm text-[#444]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <PredictionPhoneMockup className="phone-float-delayed" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof / Stats ─── */}
      <section className="w-full py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-anton tracking-tight text-[#111]">
              Built for speed.
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "60", label: "Words per story", suffix: "" },
              { value: "< 2", label: "Minutes to catch up", suffix: "min" },
              { value: "20+", label: "News sources", suffix: "" },
              { value: "24/7", label: "Market coverage", suffix: "" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-black/[0.06] p-6 text-center shadow-sm"
              >
                <div className="font-anton text-3xl md:text-4xl text-[#111] mb-1">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-lg text-[#999]"> {stat.suffix}</span>
                  )}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#999]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ + Waitlist Section ─── */}
      <section id="faq" className="w-full py-16 md:py-24 bg-[#f5f5f5]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-anton tracking-tight text-[#111]">
              Got questions?
              <br />
              Here&apos;s the answers.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-3">
              <FAQ />
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="w-full bg-[#111] pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          {/* Large brand name */}
          <div className="mb-12">
            <h2 className="text-[clamp(4rem,12vw,10rem)] font-brand font-bold text-white/[0.08] leading-none tracking-tight select-none">
              Midnight
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-white/[0.08] pt-8">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Midnight"
                width={24}
                height={24}
                className="rounded-lg"
              />
              <span className="text-sm font-brand font-medium tracking-tight text-white/80">
                Midnight
              </span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="/terms"
                className="text-white/40 text-xs font-sans hover:text-white/80 transition-colors duration-300"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="text-white/40 text-xs font-sans hover:text-white/80 transition-colors duration-300"
              >
                Privacy
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/80 hover:border-white/[0.16] transition-all duration-300"
                aria-label="X (Twitter)"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.622 5.905-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-3 mt-6">
            <span className="font-mono text-[9px] text-white/20 uppercase tracking-[0.2em]">
              &copy; 2026 Midnight Tech. All rights reserved.
            </span>
            <div className="flex items-center gap-2 font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full" />
              Systems operational
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
