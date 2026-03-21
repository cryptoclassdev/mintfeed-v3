import Image from "next/image";
import Link from "next/link";
import {
  ClientStarfield,
  ClientScrollExperience,
  ClientWaitlistForm,
} from "@/components/ClientExperience";

export default function Home() {
  return (
    <>
      {/* Nav — always visible above the scroll experience */}
      <nav className="w-full border-b border-white/[0.04] bg-[#030303]/80 backdrop-blur-xl z-50 fixed top-0">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Midnight"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="text-base font-brand font-medium tracking-tight text-[#f4f4f5]">
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

      {/* Starfield + comet background (fixed, behind everything) */}
      <ClientStarfield />

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* Scroll-driven 3D experience (Hero → Feed → Prediction → Market) */}
      <ClientScrollExperience />

      {/* Waitlist — email capture with real input */}
      <ClientWaitlistForm />

      {/* Footer */}
      <footer className="w-full bg-[#030303] border-t border-white/[0.04] pt-12 pb-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Midnight"
                width={24}
                height={24}
                className="rounded-lg"
              />
              <span className="text-sm font-brand font-medium tracking-tight text-[#f4f4f5]">
                Midnight
              </span>
            </div>

            <div className="flex items-center gap-5">
              <a
                href="/terms"
                className="text-[#555] text-xs font-sans hover:text-[#f4f4f5] transition-colors duration-300"
              >
                Terms
              </a>
              <a
                href="/privacy"
                className="text-[#555] text-xs font-sans hover:text-[#f4f4f5] transition-colors duration-300"
              >
                Privacy
              </a>
            </div>

            <a
              href="#"
              className="w-9 h-9 rounded-full border border-white/[0.06] flex items-center justify-center text-[#444] hover:text-[#f4f4f5] hover:border-white/[0.12] transition-all duration-300"
              aria-label="X (Twitter)"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.622 5.905-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>

          <div className="border-t border-[#4C8BD0]/[0.06] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <span className="font-mono text-[8px] text-[#2a2a2a] uppercase tracking-[0.2em]">
              &copy; 2026 Midnight Tech. All rights reserved.
            </span>
            <div className="flex items-center gap-2 font-mono text-[8px] text-[#444] uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-[#00D4AA] rounded-full" />
              Systems operational
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
