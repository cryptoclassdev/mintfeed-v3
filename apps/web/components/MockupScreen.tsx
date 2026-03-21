"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import Lottie from "lottie-react";
import { swipeHintAnimation } from "./lottie-data";

const MOCK_CARDS = [
  {
    category: "CRYPTO",
    categoryColor: "#F5A623",
    imageUrl: "https://picsum.photos/seed/midnight-btc-rally/680/400",
    title: "Bitcoin Surges Past $120K As Institutional Inflows Hit Record Highs",
    source: "CoinDesk",
    time: "2h ago",
    summary:
      "Bitcoin reached a new all-time high above $120,000 driven by unprecedented institutional demand. BlackRock and Fidelity reported record weekly inflows into spot Bitcoin ETFs signaling a major shift in traditional finance.",
    market: {
      question: "Will BTC reach $150K by July?",
      yesPercent: 67,
      meta: "Jul 2026 · $2.4M",
    },
  },
  {
    category: "AI",
    categoryColor: "#818CF8",
    imageUrl: "https://picsum.photos/seed/midnight-gpt5-lab/680/400",
    title: "OpenAI Launches GPT-5 With Autonomous Code Execution Capabilities",
    source: "The Verge",
    time: "4h ago",
    summary:
      "OpenAI unveiled GPT-5 featuring native code execution and multi-step reasoning. Benchmarks show 40% improvement over GPT-4 in mathematical problem-solving and scientific research capabilities.",
    market: {
      question: "Will GPT-5 pass the USMLE?",
      yesPercent: 82,
      meta: "Sep 2026 · $890K",
    },
  },
  {
    category: "CRYPTO",
    categoryColor: "#F5A623",
    imageUrl: "https://picsum.photos/seed/midnight-sol-defi/680/400",
    title: "Solana DeFi Ecosystem Crosses $30B in Total Value Locked",
    source: "The Block",
    time: "1h ago",
    summary:
      "Solana DeFi ecosystem achieved a milestone with TVL surpassing $30 billion. Growth attributed to improved infrastructure and rising developer activity across new protocols.",
    market: {
      question: "Will SOL reach $300 by Q3?",
      yesPercent: 54,
      meta: "Aug 2026 · $1.8M",
    },
  },
];

export default function MockupScreen() {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter(
      (el): el is HTMLDivElement => el !== null
    );
    const bars = barsRef.current.filter(
      (el): el is HTMLDivElement => el !== null
    );
    if (cards.length < 3 || bars.length < 3) return;

    const c0 = cards[0]!;
    const c1 = cards[1]!;
    const c2 = cards[2]!;
    const b0 = bars[0]!;
    const b1 = bars[1]!;
    const b2 = bars[2]!;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 });

      // Initial state
      tl.set(c1, { yPercent: 100, opacity: 0 });
      tl.set(c2, { yPercent: 100, opacity: 0 });
      tl.set(c0, { yPercent: 0, opacity: 1 });
      tl.set([b0, b1, b2], { scaleX: 0, transformOrigin: "left center" });

      // Animate first bar
      tl.to(b0, { scaleX: 1, duration: 0.9, ease: "power2.out" });

      // Hold card 0
      tl.to({}, { duration: 3 });

      // Card 0 → Card 1
      tl.to(c0, {
        yPercent: -12,
        opacity: 0,
        duration: 0.55,
        ease: "power2.in",
      });
      tl.fromTo(
        c1,
        { yPercent: 20, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
        "<0.08"
      );
      tl.to(b1, { scaleX: 1, duration: 0.8, ease: "power2.out" }, "<0.2");
      tl.set(c0, { yPercent: 100 });

      // Hold card 1
      tl.to({}, { duration: 3 });

      // Card 1 → Card 2
      tl.to(c1, {
        yPercent: -12,
        opacity: 0,
        duration: 0.55,
        ease: "power2.in",
      });
      tl.fromTo(
        c2,
        { yPercent: 20, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
        "<0.08"
      );
      tl.to(b2, { scaleX: 1, duration: 0.8, ease: "power2.out" }, "<0.2");
      tl.set(c1, { yPercent: 100 });

      // Hold card 2
      tl.to({}, { duration: 3 });

      // Card 2 → Card 0
      tl.to(c2, {
        yPercent: -12,
        opacity: 0,
        duration: 0.55,
        ease: "power2.in",
      });
      tl.fromTo(
        c0,
        { yPercent: 20, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.55, ease: "power2.out" },
        "<0.08"
      );
      tl.fromTo(
        b0,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.8, ease: "power2.out" },
        "<0.2"
      );
      tl.set(c2, { yPercent: 100 });

      // Hold before repeat
      tl.to({}, { duration: 3 });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#030303]">
      {/* Category chips */}
      <div className="absolute top-7 right-3 flex gap-1 z-30">
        {["All", "Crypto", "AI"].map((cat, i) => (
          <button
            key={cat}
            className={`px-2 py-[5px] rounded-[8px] font-mono text-[7px] uppercase tracking-[0.8px] border ${
              i === 0
                ? "border-[#4C8BD0]/60 text-[#4C8BD0] bg-black/50"
                : "border-[#333]/60 text-[#555] bg-black/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stacked cards */}
      {MOCK_CARDS.map((card, i) => (
        <div
          key={i}
          ref={(el) => {
            cardsRef.current[i] = el;
          }}
          className="absolute inset-0 flex flex-col will-change-transform"
        >
          {/* Hero image area — real thumbnail like the mobile app */}
          <div className="relative h-[28%] shrink-0 overflow-hidden">
            {/* Thumbnail image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            {/* Subtle outline (matches mobile: border at 40% opacity) */}
            <div className="absolute inset-0 border border-[#333]/25 pointer-events-none" />
            {/* 3-stop gradient overlay (matches mobile LinearGradient) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 30%, rgba(3,3,3,0.6) 70%, #030303 100%)",
              }}
            />
            {/* Category badge */}
            <div className="absolute bottom-3 left-4 z-10">
              <span
                className="inline-block px-2.5 py-[3px] rounded-[10px] font-mono text-[7px] uppercase tracking-[0.8px] bg-black/65 shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                style={{ color: card.categoryColor }}
              >
                {card.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-4 pt-1.5 flex flex-col min-h-0">
            {/* Accent line */}
            <div className="w-7 h-[2.5px] rounded-full bg-[#00ff66] mb-2.5 shrink-0" />

            {/* Title */}
            <h3 className="font-sans font-bold text-[14px] leading-[19px] text-[#f0f0f0] mb-2 shrink-0">
              {card.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-1.5 mb-2 shrink-0">
              <span className="font-mono text-[7.5px] uppercase tracking-[0.7px] text-[#888]">
                {card.source}
              </span>
              <span className="font-mono text-[7.5px] text-[#444]">&middot;</span>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.7px] text-[#888]">
                {card.time}
              </span>
              <span className="font-mono text-[7.5px] text-[#444]">&middot;</span>
              <span className="font-mono text-[7.5px] uppercase tracking-[0.7px] text-[#4C8BD0] underline underline-offset-2">
                Read full
              </span>
            </div>

            {/* Summary */}
            <p className="font-sans text-[11px] leading-[17px] text-[#bbb] mb-4 shrink-0">
              {card.summary}
            </p>

            {/* Prediction markets */}
            <div className="mt-auto pb-14 shrink-0">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-[5px] h-[5px] rounded-full bg-[#00D4AA]" />
                <span className="font-mono text-[6.5px] font-bold uppercase tracking-[1.5px] text-[#00D4AA]">
                  Related Markets
                </span>
              </div>

              {/* Market card */}
              <div className="flex rounded-[8px] overflow-hidden bg-[#111] shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                <div className="w-[3px] bg-[#00D4AA] shrink-0" />
                <div className="flex-1 px-2.5 py-2">
                  <p className="font-sans text-[9.5px] text-[#bbb] mb-1.5 truncate leading-tight">
                    {card.market.question}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8.5px] font-bold text-[#00ff66] tabular-nums min-w-[26px]">
                      {card.market.yesPercent}%
                    </span>
                    <div className="flex-1 h-[3px] bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        ref={(el) => {
                          barsRef.current[i] = el;
                        }}
                        className="h-full bg-[#00ff66] rounded-full will-change-transform"
                        style={{ width: `${card.market.yesPercent}%` }}
                      />
                    </div>
                    <span className="font-mono text-[6.5px] text-[#666] tabular-nums whitespace-nowrap">
                      {card.market.meta}
                    </span>
                  </div>
                </div>
              </div>

              {/* Swipe hint */}
              <div className="flex items-center justify-center gap-1 mt-3 opacity-40">
                <Lottie
                  animationData={swipeHintAnimation}
                  loop
                  autoplay
                  style={{ width: 16, height: 24 }}
                />
                <span className="font-mono text-[6px] uppercase tracking-[1px] text-[#555]">
                  Swipe to bet
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Tab bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[52px] bg-[#030303]/95 border-t border-[#333]/40 flex items-center justify-around px-8 z-40 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-[3px]">
          <svg
            className="w-[15px] h-[15px] text-[#4C8BD0]"
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
          <span className="font-mono text-[6.5px] uppercase tracking-[0.8px] text-[#4C8BD0]">
            Feed
          </span>
        </div>
        <div className="flex flex-col items-center gap-[3px]">
          <svg
            className="w-[15px] h-[15px] text-[#666]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          </svg>
          <span className="font-mono text-[6.5px] uppercase tracking-[0.8px] text-[#666]">
            Market
          </span>
        </div>
        <div className="flex flex-col items-center gap-[3px]">
          <svg
            className="w-[15px] h-[15px] text-[#666]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
          <span className="font-mono text-[6.5px] uppercase tracking-[0.8px] text-[#666]">
            Profile
          </span>
        </div>
      </div>
    </div>
  );
}
