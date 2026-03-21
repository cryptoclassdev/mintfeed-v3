"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(
      `https://form.typeform.com/to/lAIai6px#email=${encodeURIComponent(email)}`,
      "_blank"
    );
  };

  return (
    <section className="w-full bg-[#030303] py-32 lg:py-40 relative overflow-hidden">
      <div className="absolute inset-0 bg-glow-bottom opacity-30 pointer-events-none" />

      <div className="max-w-2xl mx-auto px-6 md:px-8 relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full" />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#555]">
              Early access
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-anton tracking-tighter text-[#f4f4f5] leading-[0.92] mb-4">
            Get early access.
          </h2>
          <p className="text-[#666] text-sm font-sans leading-relaxed max-w-md mx-auto">
            Join the waitlist. Be first when Midnight launches on iOS and
            Android.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 bg-[#111] border border-white/[0.08] rounded-full px-6 py-4 text-sm text-[#f4f4f5] font-sans placeholder:text-[#555] focus:outline-none focus:border-[#4C8BD0]/50 transition-colors"
          />
          <button
            type="submit"
            className="bg-[#4C8BD0] text-white font-sans font-medium text-sm py-4 px-8 rounded-full hover:bg-[#5a9de0] active:translate-y-px active:scale-[0.97] transition-all duration-200 shadow-[0_0_40px_rgba(76,139,208,0.10)] whitespace-nowrap"
          >
            Join Waitlist
          </button>
        </form>

        <p className="mt-6 text-center font-mono text-[8px] text-[#333] uppercase tracking-[0.2em]">
          No spam · No wallet required to read · Powered by Solana
        </p>
      </div>
    </section>
  );
}
