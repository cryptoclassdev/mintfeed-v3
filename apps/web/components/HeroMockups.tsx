"use client";

import { useState } from "react";
import Image from "next/image";

export default function HeroMockups() {
  const [swapped, setSwapped] = useState(false);

  return (
    <div
      className="relative flex justify-center items-center h-[480px] md:h-[580px] 2xl:h-[720px] fade-up fade-up-d4 cursor-pointer"
      onClick={() => setSwapped((s) => !s)}
    >
      {/* Market phone */}
      <div
        className="absolute transition-all duration-500 ease-out"
        style={{
          zIndex: swapped ? 10 : 0,
          transform: swapped
            ? "rotate(-5deg) translate(-70px, 0px)"
            : "rotate(6deg) translate(100px, 0px)",
        }}
      >
        <Image
          src="/mockup-market.png"
          alt="Midnight market screen"
          width={260}
          height={540}
          className="w-[220px] md:w-[260px] lg:w-[300px] 2xl:w-[340px] h-auto drop-shadow-2xl"
          priority
        />
      </div>

      {/* Feed phone */}
      <div
        className="absolute transition-all duration-500 ease-out"
        style={{
          zIndex: swapped ? 0 : 10,
          transform: swapped
            ? "rotate(6deg) translate(100px, 0px)"
            : "rotate(-5deg) translate(-70px, 0px)",
        }}
      >
        <Image
          src="/mockup-feed.png"
          alt="Midnight news feed screen"
          width={260}
          height={540}
          className="w-[220px] md:w-[260px] lg:w-[300px] 2xl:w-[340px] h-auto drop-shadow-2xl"
          priority
        />
      </div>
    </div>
  );
}
