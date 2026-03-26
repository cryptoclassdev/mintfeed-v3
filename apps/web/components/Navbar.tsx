import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full z-50 fixed top-0 bg-transparent">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-16 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Midnight"
            width={36}
            height={36}
            className="rounded-lg w-9 h-9"
          />
          <span className="font-brand font-medium tracking-tight text-[#111] text-base">
            Midnight
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 bg-white border border-black/[0.08] rounded-full px-1.5 py-1 shadow-sm">
          <a href="#features" className="text-sm text-[#666] hover:text-[#111] hover:bg-black/[0.04] px-4 py-1.5 rounded-full transition-all duration-200">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-[#666] hover:text-[#111] hover:bg-black/[0.04] px-4 py-1.5 rounded-full transition-all duration-200">
            How it works
          </a>
          <a href="#faq" className="text-sm text-[#666] hover:text-[#111] hover:bg-black/[0.04] px-4 py-1.5 rounded-full transition-all duration-200">
            FAQ
          </a>
        </div>

        <a
          href="https://form.typeform.com/to/lAIai6px"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#111] text-white font-sans font-medium text-sm px-5 py-2.5 rounded-full hover:bg-[#333] active:translate-y-px active:scale-[0.97] transition-all duration-150"
        >
          Join Waitlist
        </a>
      </div>
    </nav>
  );
}
