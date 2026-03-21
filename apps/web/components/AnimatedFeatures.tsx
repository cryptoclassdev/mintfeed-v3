"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    num: "01",
    title: "60-Word Stories",
    desc: "Every article compressed to its essential facts. Only signal, zero fluff. Get informed in seconds, not minutes.",
  },
  {
    num: "02",
    title: "Prediction Markets",
    desc: "Each story has a market attached. Read a headline, form a view, swipe YES or NO to place a bet.",
    accent: true,
  },
  {
    num: "03",
    title: "All Solana Wallets",
    desc: "Connect Phantom, Backpack, Solflare, or any Solana wallet. One tap to start predicting.",
  },
  {
    num: "04",
    title: "Settles On-Chain",
    desc: "Every prediction settles on Solana. Transparent, verifiable, and instant payouts.",
  },
];

export default function AnimatedFeatures() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading reveal
      if (headingRef.current) {
        gsap.fromTo(
          headingRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: headingRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      }

      // Staggered feature items
      const items = itemsRef.current.filter(Boolean) as HTMLDivElement[];
      if (items.length) {
        gsap.set(items, { y: 40, opacity: 0 });

        ScrollTrigger.batch(items, {
          onEnter: (batch) => {
            gsap.to(batch, {
              y: 0,
              opacity: 1,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.12,
            });
          },
          start: "top 88%",
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="w-full bg-[#030303] py-24 lg:py-32 border-b border-white/[0.04] relative"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.015] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 relative z-10">
        <div ref={headingRef} className="mb-16 max-w-xl">
          <h2 className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#444] mb-5">
            Features
          </h2>
          <p className="text-3xl md:text-4xl font-sans font-medium tracking-tight text-[#f4f4f5] leading-[1.15]">
            Maximum information.
            <br />
            <span className="text-[#555]">Minimum time.</span>
          </p>
        </div>

        <div className="border-t border-white/[0.06]">
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-10 md:py-12 border-b border-white/[0.06] group"
            >
              <div className="md:col-span-1">
                <span
                  className={`font-anton text-3xl md:text-4xl transition-colors duration-500 ${
                    f.accent
                      ? "text-[#00D4AA]/15 group-hover:text-[#00D4AA]/30"
                      : "text-[#4C8BD0]/12 group-hover:text-[#4C8BD0]/25"
                  }`}
                >
                  {f.num}
                </span>
              </div>
              <div className="md:col-span-4 flex items-start md:pt-1">
                <h3
                  className={`text-lg md:text-xl font-sans font-medium tracking-tight ${
                    f.accent ? "text-[#00D4AA]" : "text-[#f4f4f5]"
                  }`}
                >
                  {f.title}
                </h3>
              </div>
              <div className="md:col-span-7 flex items-start md:pt-1.5">
                <p className="text-[#555] text-sm font-sans leading-relaxed max-w-md">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
