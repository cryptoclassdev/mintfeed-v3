import Image from "next/image";

export default function PhoneMockup() {
  return (
    <div className="relative w-[340px] h-[748px] rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden z-20">
      {/* Bezel border ring */}
      <div className="absolute inset-0 rounded-[2.5rem] border-[0.5px] border-[#ffffff15] z-50 pointer-events-none" />

      {/* Screenshot — edge-to-edge, crops Android status bar */}
      <Image
        src="/app-preview.png"
        alt="Midnight app preview showing crypto news feed with prediction markets"
        width={1080}
        height={2400}
        className="absolute inset-0 w-full h-full object-cover outline outline-1 -outline-offset-1 outline-white/10 rounded-[2.5rem]"
        style={{ objectPosition: "center 2.6%" }}
        priority
      />

      {/* Top gradient — hides Android status bar text */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#030303] to-transparent z-10 pointer-events-none" />

      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[22px] bg-[#000000] rounded-b-[14px] z-50" />

      {/* Bottom gradient — hides Android gesture bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#030303] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
