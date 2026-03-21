"use client";

import dynamic from "next/dynamic";

const StarfieldComet = dynamic(
  () => import("@/components/StarfieldComet"),
  { ssr: false }
);

const ScrollExperience = dynamic(
  () => import("@/components/ScrollExperience"),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen bg-[#030303] flex items-center justify-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#333] animate-pulse">
          Loading experience...
        </span>
      </div>
    ),
  }
);

const WaitlistForm = dynamic(() => import("@/components/WaitlistForm"), {
  ssr: false,
});

export function ClientStarfield() {
  return <StarfieldComet />;
}

export function ClientScrollExperience() {
  return <ScrollExperience />;
}

export function ClientWaitlistForm() {
  return <WaitlistForm />;
}
