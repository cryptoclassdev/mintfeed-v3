"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const SCROLL_THRESHOLD = 50;

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`w-full z-50 fixed top-0 transition-all duration-300 ${
        scrolled
          ? "bg-[#030303]/70 backdrop-blur-xl border-b border-white/[0.04]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Midnight"
            width={28}
            height={28}
            className={`rounded-lg transition-all duration-300 ${
              scrolled ? "w-9 h-9" : "w-7 h-7"
            }`}
          />
          <span
            className={`font-brand font-medium tracking-tight text-[#f4f4f5] transition-all duration-300 ${
              scrolled
                ? "opacity-0 w-0 overflow-hidden"
                : "opacity-100 text-base"
            }`}
          >
            Midnight
          </span>
        </Link>
        <a
          href="https://form.typeform.com/to/lAIai6px"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#4C8BD0] text-white font-sans font-medium text-xs px-5 py-2.5 rounded-full hover:bg-[#5a9de0] active:translate-y-px active:scale-[0.97] transition-all duration-150"
        >
          Join Waitlist
        </a>
      </div>
    </nav>
  );
}
