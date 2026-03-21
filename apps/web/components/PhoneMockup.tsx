export default function PhoneMockup({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div
      className="relative w-[340px] h-[748px] rounded-[2.5rem] overflow-hidden z-20"
      style={{
        /* 6-layer shadow compositing (from research: Conor Luddy technique) */
        boxShadow: [
          "0 0 0 1px rgba(255,255,255,0.06)", // bezel edge
          "inset 0 1px 0 rgba(255,255,255,0.04)", // top glint
          "0 4px 8px rgba(0,0,0,0.3)", // tight shadow
          "0 12px 24px rgba(0,0,0,0.25)", // medium shadow
          "0 32px 64px -12px rgba(0,0,0,0.5)", // diffuse shadow
          "0 64px 120px -24px rgba(0,0,0,0.4)", // far shadow
        ].join(", "),
      }}
    >
      {/* Bezel border ring */}
      <div className="absolute inset-0 rounded-[2.5rem] border-[0.5px] border-white/[0.06] z-50 pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
        {children}
      </div>

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-7 bg-gradient-to-b from-[#030303] to-transparent z-30 pointer-events-none" />

      {/* Dynamic Island */}
      <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[90px] h-[22px] bg-[#030303] rounded-full z-50" />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#030303] to-transparent z-30 pointer-events-none" />

      {/* Glass glint — diagonal highlight across bezel */}
      <div
        className="absolute inset-0 rounded-[2.5rem] z-40 pointer-events-none opacity-[0.03]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%)",
        }}
      />
    </div>
  );
}
