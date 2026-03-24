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
    <div className="bg-white rounded-2xl border border-black/[0.06] p-8 shadow-sm">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#999]">
            Early access
          </span>
        </div>
        <h3 className="text-2xl font-brand tracking-tight text-[#111] mb-2">
          Get early access.
        </h3>
        <p className="text-sm text-[#666] leading-relaxed">
          Join the waitlist. Be first when Midnight launches on Android.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full bg-[#f5f5f5] border border-black/[0.08] rounded-xl px-5 py-3.5 text-sm text-[#111] font-sans placeholder:text-[#aaa] focus:outline-none focus:border-[#4C8BD0]/50 focus:ring-2 focus:ring-[#4C8BD0]/10 transition-all"
        />
        <button
          type="submit"
          className="w-full bg-[#111] text-white font-sans font-medium text-sm py-3.5 px-8 rounded-xl hover:bg-[#333] active:translate-y-px active:scale-[0.99] transition-all duration-200"
        >
          Join Waitlist
        </button>
      </form>

    </div>
  );
}
