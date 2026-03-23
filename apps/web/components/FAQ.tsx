"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "What is Midnight?",
    answer:
      "Midnight is a crypto and AI news app that compresses every story to 60 words. Swipe through the feed, form a view on what's happening, and place on-chain predictions — all in under a minute.",
  },
  {
    question: "How do prediction markets work?",
    answer:
      "Each news story can have a related prediction market. Read the headline, form your view, then bet YES or NO. All markets settle on Solana. Your position is fully on-chain and non-custodial.",
  },
  {
    question: "Do I need a crypto wallet?",
    answer:
      "No wallet is required to read the news feed. To place predictions, you can connect any Solana wallet — Phantom, Backpack, Solflare, and more. We never hold your funds.",
  },
  {
    question: "What platforms will Midnight be available on?",
    answer:
      "Midnight will launch on both iOS and Android. Join the waitlist to be first when we launch.",
  },
  {
    question: "Is Midnight free to use?",
    answer:
      "Reading the news feed is completely free. Prediction markets involve on-chain transactions with standard Solana network fees (fractions of a cent).",
  },
  {
    question: "Where does the news come from?",
    answer:
      "We aggregate from trusted crypto and AI news sources, then use AI to compress each story to its essential facts — 60 words, no fluff, just signal.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {FAQS.map((faq, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left"
          >
            <span className="text-[15px] font-medium text-[#111] pr-4">
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 text-[#999] shrink-0 transition-transform duration-300 ${
                openIndex === i ? "rotate-45" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div className={`faq-answer ${openIndex === i ? "open" : ""}`}>
            <div>
              <p className="px-6 pb-5 text-sm text-[#666] leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
