/**
 * Light-mode phone mockup frames for the landing page.
 * Flat 2D mockups with subtle shadows — no 3D rendering.
 */

/* ─── Phone Frame ─── */
function PhoneFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative w-[260px] h-[532px] rounded-[40px] bg-[#111] p-[8px] shadow-[0_20px_60px_rgba(0,0,0,0.15),0_8px_20px_rgba(0,0,0,0.08)] ${className}`}
    >
      {/* Notch */}
      <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[80px] h-[24px] bg-[#111] rounded-b-[14px] z-20" />
      {/* Screen */}
      <div className="w-full h-full rounded-[32px] overflow-hidden bg-[#030303] relative">
        {children}
      </div>
    </div>
  );
}

/* ─── Feed Screen (light landing page version) ─── */
export function FeedPhoneMockup({ className = "" }: { className?: string }) {
  return (
    <PhoneFrame className={className}>
      <div
        className="w-full h-full bg-[#030303] relative overflow-hidden select-none text-xs"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {/* Category chips */}
        <div className="absolute top-5 right-3 flex gap-1 z-10">
          <span className="px-1.5 py-[3px] rounded-md font-mono text-[6px] uppercase tracking-[0.8px] border border-[#4C8BD0]/60 text-[#4C8BD0] bg-black/50">
            All
          </span>
          <span className="px-1.5 py-[3px] rounded-md font-mono text-[6px] uppercase tracking-[0.8px] border border-[#333]/60 text-[#555] bg-black/60">
            Crypto
          </span>
          <span className="px-1.5 py-[3px] rounded-md font-mono text-[6px] uppercase tracking-[0.8px] border border-[#333]/60 text-[#555] bg-black/60">
            AI
          </span>
        </div>

        {/* Image area */}
        <div className="relative h-[28%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://picsum.photos/seed/midnight-btc-rally/680/400"
            alt=""
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 30%, rgba(3,3,3,0.6) 70%, #030303 100%)",
            }}
          />
          <div className="absolute bottom-2 left-3 z-10">
            <span className="px-2 py-[2px] rounded-lg font-mono text-[5px] uppercase tracking-[0.8px] bg-black/65 text-[#F5A623]">
              CRYPTO
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pt-1">
          <div className="w-5 h-[2px] rounded-full bg-[#00ff66] mb-2" />
          <h3 className="font-bold text-[11px] leading-[15px] text-[#f0f0f0] mb-1.5">
            Bitcoin Surges Past $120K As Institutional Inflows Hit Record Highs
          </h3>
          <div className="flex items-center gap-1 mb-1.5">
            <span className="font-mono text-[5.5px] uppercase tracking-[0.7px] text-[#888]">
              CoinDesk
            </span>
            <span className="font-mono text-[5.5px] text-[#444]">&middot;</span>
            <span className="font-mono text-[5.5px] uppercase tracking-[0.7px] text-[#888]">
              2h ago
            </span>
          </div>
          <p className="text-[8.5px] leading-[13px] text-[#bbb] mb-3">
            Bitcoin reached a new all-time high above $120,000 driven by
            unprecedented institutional demand. BlackRock and Fidelity reported
            record weekly inflows into spot Bitcoin ETFs.
          </p>

          {/* Prediction market card */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-[4px] h-[4px] rounded-full bg-[#00D4AA]" />
            <span className="font-mono text-[5px] font-bold uppercase tracking-[1.5px] text-[#00D4AA]">
              Related Markets
            </span>
          </div>
          <div className="flex rounded-lg overflow-hidden bg-[#111]">
            <div className="w-[2.5px] bg-[#00D4AA] shrink-0" />
            <div className="flex-1 px-2 py-1.5">
              <p className="text-[7.5px] text-[#bbb] mb-1 truncate leading-tight">
                Will BTC reach $150K by July?
              </p>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[7px] font-bold text-[#00ff66] tabular-nums">
                  67%
                </span>
                <div className="flex-1 h-[2.5px] bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00ff66] rounded-full"
                    style={{ width: "67%" }}
                  />
                </div>
                <span className="font-mono text-[5px] text-[#666] tabular-nums">
                  Jul 2026
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[36px] bg-[#030303]/95 border-t border-[#333]/40 flex items-center justify-around px-6">
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#4C8BD0]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#4C8BD0]">
              Feed
            </span>
          </div>
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#666]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#666]">
              Market
            </span>
          </div>
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#666]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#666]">
              Profile
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ─── Prediction Screen ─── */
export function PredictionPhoneMockup({
  className = "",
}: {
  className?: string;
}) {
  return (
    <PhoneFrame className={className}>
      <div
        className="w-full h-full bg-[#030303] relative overflow-hidden select-none"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="px-3 pt-6 pb-2 flex items-center gap-2">
          <svg
            className="w-3 h-3 text-[#888]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="font-mono text-[6px] uppercase tracking-[1px] text-[#888]">
            Market Details
          </span>
        </div>

        {/* Question */}
        <div className="px-3 mb-4">
          <h3 className="font-bold text-[12px] leading-[17px] text-[#f0f0f0]">
            Will BTC reach $150K by July 2026?
          </h3>
        </div>

        {/* Big probability */}
        <div className="px-3 mb-3">
          <div className="flex items-end gap-1.5 mb-2">
            <span className="font-mono text-[28px] font-bold text-[#00ff66] leading-none tabular-nums">
              67%
            </span>
            <span className="font-mono text-[7px] text-[#888] uppercase tracking-[1px] mb-1">
              chance yes
            </span>
          </div>
          <div className="h-[4px] bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00ff66] rounded-full"
              style={{ width: "67%" }}
            />
          </div>
        </div>

        {/* YES / NO buttons */}
        <div className="px-3 flex gap-2 mb-4">
          <button className="flex-1 py-2.5 rounded-lg bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66] font-mono text-[8px] font-bold uppercase tracking-[1px]">
            Yes
          </button>
          <button className="flex-1 py-2.5 rounded-lg bg-[#E60000]/10 border border-[#E60000]/20 text-[#E60000] font-mono text-[8px] font-bold uppercase tracking-[1px]">
            No
          </button>
        </div>

        {/* Stats row */}
        <div className="px-3 flex items-center gap-3 mb-4">
          <div>
            <span className="font-mono text-[5px] text-[#555] uppercase tracking-[1px] block mb-0.5">
              Volume
            </span>
            <span className="font-mono text-[9px] text-[#f0f0f0] tabular-nums font-bold">
              $2.4M
            </span>
          </div>
          <div className="w-px h-5 bg-[#222]" />
          <div>
            <span className="font-mono text-[5px] text-[#555] uppercase tracking-[1px] block mb-0.5">
              Ends
            </span>
            <span className="font-mono text-[9px] text-[#f0f0f0] tabular-nums font-bold">
              Jul 2026
            </span>
          </div>
          <div className="w-px h-5 bg-[#222]" />
          <div>
            <span className="font-mono text-[5px] text-[#555] uppercase tracking-[1px] block mb-0.5">
              Traders
            </span>
            <span className="font-mono text-[9px] text-[#f0f0f0] tabular-nums font-bold">
              3,847
            </span>
          </div>
        </div>

        {/* Recent activity */}
        <div className="px-3">
          <span className="font-mono text-[5px] uppercase tracking-[1.5px] text-[#555] mb-1.5 block">
            Recent Activity
          </span>
          {[
            { name: "marcelo.sol", side: "YES", amount: "$250", time: "2m" },
            { name: "kira.btc", side: "NO", amount: "$100", time: "5m" },
            { name: "alex.sol", side: "YES", amount: "$500", time: "8m" },
            { name: "nova.eth", side: "YES", amount: "$75", time: "12m" },
          ].map((bet, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-white/[0.04]"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-[#1a1a2e] flex items-center justify-center font-mono text-[5px] text-[#71717a]">
                  {bet.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-mono text-[7px] text-[#bbb]">
                  {bet.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-mono text-[6px] font-bold ${
                    bet.side === "YES" ? "text-[#00ff66]" : "text-[#E60000]"
                  }`}
                >
                  {bet.side}
                </span>
                <span className="font-mono text-[7px] text-[#888] tabular-nums">
                  {bet.amount}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[36px] bg-[#030303]/95 border-t border-[#333]/40 flex items-center justify-around px-6">
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#4C8BD0]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#4C8BD0]">
              Feed
            </span>
          </div>
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#666]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#666]">
              Market
            </span>
          </div>
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#666]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#666]">
              Profile
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ─── Market Screen ─── */
export function MarketPhoneMockup({ className = "" }: { className?: string }) {
  const coins = [
    { rank: "01", name: "Bitcoin", symbol: "BTC", price: "$121,450", change: "+3.2%", positive: true, color: "#F7931A" },
    { rank: "02", name: "Ethereum", symbol: "ETH", price: "$4,180", change: "+1.8%", positive: true, color: "#627EEA" },
    { rank: "03", name: "Solana", symbol: "SOL", price: "$245.30", change: "+5.7%", positive: true, color: "#00D4AA" },
    { rank: "04", name: "Avalanche", symbol: "AVAX", price: "$42.15", change: "-1.2%", positive: false, color: "#E84142" },
    { rank: "05", name: "Sui", symbol: "SUI", price: "$3.89", change: "+8.4%", positive: true, color: "#4DA2FF" },
    { rank: "06", name: "Chainlink", symbol: "LINK", price: "$28.75", change: "+2.1%", positive: true, color: "#2A5ADA" },
  ];

  return (
    <PhoneFrame className={className}>
      <div
        className="w-full h-full bg-[#030303] relative overflow-hidden select-none"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="px-3 pt-6 pb-2 flex items-center justify-between">
          <span
            className="text-[15px] font-bold text-[#f4f4f5]"
            style={{
              fontFamily: "var(--font-blauer), system-ui, sans-serif",
            }}
          >
            Market
          </span>
          <div className="flex items-center gap-1">
            <div className="w-[4px] h-[4px] rounded-full bg-[#00ff66]" />
            <span className="font-mono text-[5px] uppercase tracking-[1px] text-[#00ff66]">
              Live
            </span>
          </div>
        </div>

        {/* Coin list */}
        <div className="px-3">
          {coins.map((coin) => (
            <div
              key={coin.symbol}
              className="flex items-center py-2.5 border-b border-white/[0.04]"
            >
              <span className="font-mono text-[6px] text-[#555] w-4 tabular-nums">
                {coin.rank}
              </span>
              <div
                className="w-5 h-5 rounded-full mr-2 flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                style={{ backgroundColor: coin.color }}
              >
                {coin.symbol[0]}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-semibold text-[#f0f0f0] block">
                  {coin.name}
                </span>
                <span className="font-mono text-[6px] text-[#555] uppercase tracking-[0.5px]">
                  {coin.symbol}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[8px] font-bold text-[#f0f0f0] tabular-nums block">
                  {coin.price}
                </span>
                <span
                  className={`font-mono text-[7px] tabular-nums ${
                    coin.positive ? "text-[#00ff66]" : "text-[#E60000]"
                  }`}
                >
                  {coin.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[36px] bg-[#030303]/95 border-t border-[#333]/40 flex items-center justify-around px-6">
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#666]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#666]">
              Feed
            </span>
          </div>
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#4C8BD0]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#4C8BD0]">
              Market
            </span>
          </div>
          <div className="flex flex-col items-center gap-[2px]">
            <svg
              className="w-[10px] h-[10px] text-[#666]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
            <span className="font-mono text-[4px] uppercase tracking-[0.8px] text-[#666]">
              Profile
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
