"use client";

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Phone3D from "./Phone3D";
import {
  FeedScreen,
  PredictionScreen,
  MarketScreen,
} from "./PhoneScreenContent";
import LottiePulse from "./LottiePulse";

gsap.registerPlugin(ScrollTrigger);

const SCREENS = [FeedScreen, PredictionScreen, MarketScreen] as const;

export default function ScrollExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useRef(0);
  const [screenIndex, setScreenIndex] = useState(0);
  const lastScreenRef = useRef(0);

  // Text overlay refs for GSAP direct DOM animation (no React re-renders)
  const heroRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const predRef = useRef<HTMLDivElement>(null);
  const marketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Set initial states
    gsap.set([feedRef.current, predRef.current, marketRef.current], {
      opacity: 0,
      y: 30,
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        onUpdate: (self) => {
          // Update scroll ref for R3F (every frame, no re-render)
          scrollProgress.current = self.progress;

          // Update screen index (only when it changes)
          const idx =
            self.progress < 0.3 ? 0 : self.progress < 0.6 ? 1 : 2;
          if (idx !== lastScreenRef.current) {
            lastScreenRef.current = idx;
            setScreenIndex(idx);
          }
        },
      },
    });

    // Hero: visible 0-12%, fade out 12-16%
    tl.to(heroRef.current, { opacity: 0, y: -20, duration: 0.04 }, 0.12);

    // Feed: fade in 18-22%, visible, fade out 28-32%
    tl.to(feedRef.current, { opacity: 1, y: 0, duration: 0.04 }, 0.18);
    tl.to(feedRef.current, { opacity: 0, y: -20, duration: 0.04 }, 0.28);

    // Prediction: fade in 34-38%, visible, fade out 54-58%
    tl.to(predRef.current, { opacity: 1, y: 0, duration: 0.04 }, 0.34);
    tl.to(predRef.current, { opacity: 0, y: -20, duration: 0.04 }, 0.54);

    // Market: fade in 62-66%, visible, fade out 78-82%
    tl.to(marketRef.current, { opacity: 1, y: 0, duration: 0.04 }, 0.62);
    tl.to(marketRef.current, { opacity: 0, y: -20, duration: 0.04 }, 0.78);

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const CurrentScreen = SCREENS[screenIndex] ?? FeedScreen;

  return (
    <div ref={containerRef} style={{ height: "500vh" }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* 3D Canvas — full screen, phone offset right */}
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 10], fov: 32 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <Suspense fallback={null}>
              <Phone3D scrollProgress={scrollProgress}>
                <div className="relative w-[340px] h-[728px] bg-[#030303] overflow-hidden rounded-[24px]">
                  {/* Crossfade between screens */}
                  {SCREENS.map((Screen, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 transition-opacity duration-500"
                      style={{ opacity: screenIndex === i ? 1 : 0 }}
                    >
                      <Screen />
                    </div>
                  ))}
                </div>
              </Phone3D>
            </Suspense>
          </Canvas>
        </div>

        {/* Text overlays — left half, GSAP-driven opacity */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-[48%] z-10 pointer-events-none">
          <div className="h-full flex items-center px-6 md:px-8 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))]">
            {/* Hero */}
            <div
              ref={heroRef}
              className="absolute inset-0 flex items-center px-6 md:px-8 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))] pointer-events-auto"
            >
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 mb-6">
                  <LottiePulse />
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#555]">
                    Live on Solana Mainnet
                  </span>
                </div>
                <h1 className="text-6xl sm:text-7xl lg:text-[96px] font-anton leading-[0.92] tracking-tighter text-[#f4f4f5] mb-6">
                  Read <span className="text-[#555]">less.</span>
                  <br />
                  Predict <span className="text-[#00D4AA]">more.</span>
                </h1>
                <p className="text-[#666] text-[15px] font-sans leading-7 max-w-md mb-8">
                  Midnight is a crypto news feed where every story is compressed
                  to 60 words. Swipe through, form a view, and place on-chain
                  predictions.
                </p>
                <a
                  href="https://form.typeform.com/to/lAIai6px"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#4C8BD0] text-white font-sans font-medium text-sm py-4 px-8 rounded-full hover:bg-[#5a9de0] active:translate-y-px active:scale-[0.97] transition-all duration-200 shadow-[0_0_40px_rgba(76,139,208,0.10)]"
                >
                  Join Waitlist
                </a>
              </div>
            </div>

            {/* Feed section text */}
            <div
              ref={feedRef}
              className="absolute inset-0 flex items-center px-6 md:px-8 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))]"
            >
              <div className="max-w-md">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#4C8BD0] mb-4 block">
                  01 — Feed
                </span>
                <h2 className="text-4xl md:text-5xl font-anton tracking-tighter text-[#f4f4f5] leading-[0.95] mb-4">
                  60-word
                  <br />
                  stories.
                </h2>
                <p className="text-[#666] text-sm font-sans leading-relaxed max-w-sm">
                  Every article compressed to its essential facts. Only signal,
                  zero fluff. Swipe up to the next story instantly.
                </p>
              </div>
            </div>

            {/* Prediction section text */}
            <div
              ref={predRef}
              className="absolute inset-0 flex items-center px-6 md:px-8 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))]"
            >
              <div className="max-w-md">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#00D4AA] mb-4 block">
                  02 — Predict
                </span>
                <h2 className="text-4xl md:text-5xl font-anton tracking-tighter text-[#f4f4f5] leading-[0.95] mb-4">
                  Swipe
                  <br />
                  to bet.
                </h2>
                <p className="text-[#666] text-sm font-sans leading-relaxed max-w-sm">
                  Each story has a prediction market. Read the headline, form a
                  view, swipe YES or NO. All markets settle on Solana.
                </p>
              </div>
            </div>

            {/* Market section text */}
            <div
              ref={marketRef}
              className="absolute inset-0 flex items-center px-6 md:px-8 lg:pl-[max(2rem,calc((100vw-1400px)/2+2rem))]"
            >
              <div className="max-w-md">
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#4C8BD0] mb-4 block">
                  03 — Market
                </span>
                <h2 className="text-4xl md:text-5xl font-anton tracking-tighter text-[#f4f4f5] leading-[0.95] mb-4">
                  All markets.
                  <br />
                  Real-time.
                </h2>
                <p className="text-[#666] text-sm font-sans leading-relaxed max-w-sm">
                  Track crypto prices with live data. Connect any Solana wallet
                  — Phantom, Backpack, Solflare, and more.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator (hero only) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-40">
          <span className="font-mono text-[7px] uppercase tracking-[1.5px] text-[#555]">
            Scroll
          </span>
          <svg
            className="w-4 h-4 text-[#555] animate-bounce"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
}
