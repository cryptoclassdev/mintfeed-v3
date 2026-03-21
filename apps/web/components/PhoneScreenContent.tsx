/**
 * Recreated app screens rendered as HTML inside the 3D phone via drei <Html>.
 * Three screens: Feed (news card), Prediction (market detail), Market (prices).
 */

/* ─── Shared Tab Bar ─── */
function TabBar({ active = "feed" }: { active?: "feed" | "market" | "profile" }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-[#030303]/95 border-t border-[#333]/40 flex items-center justify-around px-8 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-[3px]">
        <svg className={`w-[14px] h-[14px] ${active === "feed" ? "text-[#4C8BD0]" : "text-[#666]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        <span className={`font-mono text-[6px] uppercase tracking-[0.8px] ${active === "feed" ? "text-[#4C8BD0]" : "text-[#666]"}`}>Feed</span>
      </div>
      <div className="flex flex-col items-center gap-[3px]">
        <svg className={`w-[14px] h-[14px] ${active === "market" ? "text-[#4C8BD0]" : "text-[#666]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        </svg>
        <span className={`font-mono text-[6px] uppercase tracking-[0.8px] ${active === "market" ? "text-[#4C8BD0]" : "text-[#666]"}`}>Market</span>
      </div>
      <div className="flex flex-col items-center gap-[3px]">
        <svg className={`w-[14px] h-[14px] ${active === "profile" ? "text-[#4C8BD0]" : "text-[#666]"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M20 21a8 8 0 1 0-16 0" />
        </svg>
        <span className={`font-mono text-[6px] uppercase tracking-[0.8px] ${active === "profile" ? "text-[#4C8BD0]" : "text-[#666]"}`}>Profile</span>
      </div>
    </div>
  );
}

/* ─── Feed Screen ─── */
export function FeedScreen() {
  return (
    <div className="w-[340px] h-[728px] bg-[#030303] relative overflow-hidden select-none" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Category chips */}
      <div className="absolute top-7 right-3 flex gap-1 z-10">
        <span className="px-2 py-[5px] rounded-[8px] font-mono text-[7px] uppercase tracking-[0.8px] border border-[#4C8BD0]/60 text-[#4C8BD0] bg-black/50">All</span>
        <span className="px-2 py-[5px] rounded-[8px] font-mono text-[7px] uppercase tracking-[0.8px] border border-[#333]/60 text-[#555] bg-black/60">Crypto</span>
        <span className="px-2 py-[5px] rounded-[8px] font-mono text-[7px] uppercase tracking-[0.8px] border border-[#333]/60 text-[#555] bg-black/60">AI</span>
      </div>

      {/* Image area */}
      <div className="relative h-[28%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://picsum.photos/seed/midnight-btc-rally/680/400" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 border border-[#333]/25" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(3,3,3,0.6) 70%, #030303 100%)" }} />
        <div className="absolute bottom-3 left-4 z-10">
          <span className="px-2.5 py-[3px] rounded-[10px] font-mono text-[7px] uppercase tracking-[0.8px] bg-black/65 text-[#F5A623] shadow-sm">CRYPTO</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-1.5">
        <div className="w-7 h-[2.5px] rounded-full bg-[#00ff66] mb-2.5" />
        <h3 className="font-bold text-[14px] leading-[19px] text-[#f0f0f0] mb-2">
          Bitcoin Surges Past $120K As Institutional Inflows Hit Record Highs
        </h3>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-mono text-[7.5px] uppercase tracking-[0.7px] text-[#888]">CoinDesk</span>
          <span className="font-mono text-[7.5px] text-[#444]">&middot;</span>
          <span className="font-mono text-[7.5px] uppercase tracking-[0.7px] text-[#888]">2h ago</span>
          <span className="font-mono text-[7.5px] text-[#444]">&middot;</span>
          <span className="font-mono text-[7.5px] uppercase tracking-[0.7px] text-[#4C8BD0] underline underline-offset-2">Read full</span>
        </div>
        <p className="text-[11px] leading-[17px] text-[#bbb] mb-4">
          Bitcoin reached a new all-time high above $120,000 driven by unprecedented institutional demand. BlackRock and Fidelity reported record weekly inflows into spot Bitcoin ETFs.
        </p>

        {/* Prediction market card */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-[5px] h-[5px] rounded-full bg-[#00D4AA]" />
          <span className="font-mono text-[6.5px] font-bold uppercase tracking-[1.5px] text-[#00D4AA]">Related Markets</span>
        </div>
        <div className="flex rounded-[8px] overflow-hidden bg-[#111] shadow-sm">
          <div className="w-[3px] bg-[#00D4AA] shrink-0" />
          <div className="flex-1 px-2.5 py-2">
            <p className="text-[9.5px] text-[#bbb] mb-1.5 truncate leading-tight">Will BTC reach $150K by July?</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8.5px] font-bold text-[#00ff66] tabular-nums min-w-[26px]">67%</span>
              <div className="flex-1 h-[3px] bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff66] rounded-full" style={{ width: "67%" }} />
              </div>
              <span className="font-mono text-[6.5px] text-[#666] tabular-nums">Jul 2026 · $2.4M</span>
            </div>
          </div>
        </div>
      </div>

      <TabBar active="feed" />
    </div>
  );
}

/* ─── Prediction Detail Screen (tapped on a market) ─── */
export function PredictionScreen() {
  const bets = [
    { name: "marcelo.sol", side: "YES" as const, amount: "$250", time: "2m" },
    { name: "kira.btc", side: "NO" as const, amount: "$100", time: "5m" },
    { name: "alex.sol", side: "YES" as const, amount: "$500", time: "8m" },
    { name: "nova.eth", side: "YES" as const, amount: "$75", time: "12m" },
  ];

  return (
    <div className="w-[340px] h-[728px] bg-[#030303] relative overflow-hidden select-none" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-3 flex items-center gap-3">
        <svg className="w-4 h-4 text-[#888]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="font-mono text-[8px] uppercase tracking-[1px] text-[#888]">Market Details</span>
      </div>

      {/* Question */}
      <div className="px-4 mb-5">
        <h3 className="font-bold text-[16px] leading-[22px] text-[#f0f0f0]">
          Will BTC reach $150K by July 2026?
        </h3>
      </div>

      {/* Big probability */}
      <div className="px-4 mb-4">
        <div className="flex items-end gap-2 mb-2.5">
          <span className="font-mono text-[38px] font-bold text-[#00ff66] leading-none tabular-nums">67%</span>
          <span className="font-mono text-[9px] text-[#888] uppercase tracking-[1px] mb-1.5">chance yes</span>
        </div>
        <div className="h-[6px] bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-full bg-[#00ff66] rounded-full" style={{ width: "67%" }} />
        </div>
      </div>

      {/* YES / NO buttons */}
      <div className="px-4 flex gap-3 mb-5">
        <button className="flex-1 py-3.5 rounded-xl bg-[#00ff66]/10 border border-[#00ff66]/20 text-[#00ff66] font-mono text-[11px] font-bold uppercase tracking-[1px]">
          Yes
        </button>
        <button className="flex-1 py-3.5 rounded-xl bg-[#E60000]/10 border border-[#E60000]/20 text-[#E60000] font-mono text-[11px] font-bold uppercase tracking-[1px]">
          No
        </button>
      </div>

      {/* Stats row */}
      <div className="px-4 flex items-center gap-4 mb-6">
        <div>
          <span className="font-mono text-[7px] text-[#555] uppercase tracking-[1px] block mb-0.5">Volume</span>
          <span className="font-mono text-[12px] text-[#f0f0f0] tabular-nums font-bold">$2.4M</span>
        </div>
        <div className="w-px h-7 bg-[#222]" />
        <div>
          <span className="font-mono text-[7px] text-[#555] uppercase tracking-[1px] block mb-0.5">Ends</span>
          <span className="font-mono text-[12px] text-[#f0f0f0] tabular-nums font-bold">Jul 2026</span>
        </div>
        <div className="w-px h-7 bg-[#222]" />
        <div>
          <span className="font-mono text-[7px] text-[#555] uppercase tracking-[1px] block mb-0.5">Traders</span>
          <span className="font-mono text-[12px] text-[#f0f0f0] tabular-nums font-bold">3,847</span>
        </div>
      </div>

      {/* Recent activity */}
      <div className="px-4">
        <span className="font-mono text-[7px] uppercase tracking-[1.5px] text-[#555] mb-2 block">Recent Activity</span>
        {bets.map((bet, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#1a1a2e] flex items-center justify-center font-mono text-[7px] text-[#71717a]">
                {bet.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-mono text-[9px] text-[#bbb]">{bet.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-[8px] font-bold ${bet.side === "YES" ? "text-[#00ff66]" : "text-[#E60000]"}`}>
                {bet.side}
              </span>
              <span className="font-mono text-[9px] text-[#888] tabular-nums">{bet.amount}</span>
              <span className="font-mono text-[7px] text-[#555]">{bet.time}</span>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="feed" />
    </div>
  );
}

/* ─── Market / Prices Screen ─── */
export function MarketScreen() {
  const coins = [
    { rank: "01", name: "Bitcoin", symbol: "BTC", price: "$121,450", change: "+3.2%", positive: true, color: "#F7931A" },
    { rank: "02", name: "Ethereum", symbol: "ETH", price: "$4,180", change: "+1.8%", positive: true, color: "#627EEA" },
    { rank: "03", name: "Solana", symbol: "SOL", price: "$245.30", change: "+5.7%", positive: true, color: "#00D4AA" },
    { rank: "04", name: "Avalanche", symbol: "AVAX", price: "$42.15", change: "-1.2%", positive: false, color: "#E84142" },
    { rank: "05", name: "Sui", symbol: "SUI", price: "$3.89", change: "+8.4%", positive: true, color: "#4DA2FF" },
    { rank: "06", name: "Chainlink", symbol: "LINK", price: "$28.75", change: "+2.1%", positive: true, color: "#2A5ADA" },
  ];

  return (
    <div className="w-[340px] h-[728px] bg-[#030303] relative overflow-hidden select-none" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-3 flex items-center justify-between">
        <span className="text-[20px] font-bold text-[#f4f4f5]" style={{ fontFamily: "var(--font-blauer), system-ui, sans-serif" }}>Market</span>
        <div className="flex items-center gap-1.5">
          <div className="w-[5px] h-[5px] rounded-full bg-[#00ff66]" />
          <span className="font-mono text-[7px] uppercase tracking-[1px] text-[#00ff66]">Live</span>
        </div>
      </div>

      {/* Coin list */}
      <div className="px-4">
        {coins.map((coin) => (
          <div key={coin.symbol} className="flex items-center py-3 border-b border-white/[0.04]">
            <span className="font-mono text-[8px] text-[#555] w-5 tabular-nums">{coin.rank}</span>
            <div
              className="w-7 h-7 rounded-full mr-2.5 flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ backgroundColor: coin.color }}
            >
              {coin.symbol[0]}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[12px] font-semibold text-[#f0f0f0] block">{coin.name}</span>
              <span className="font-mono text-[8px] text-[#555] uppercase tracking-[0.5px]">{coin.symbol}</span>
            </div>
            <div className="text-right">
              <span className="font-mono text-[11px] font-bold text-[#f0f0f0] tabular-nums block">{coin.price}</span>
              <span className={`font-mono text-[9px] tabular-nums ${coin.positive ? "text-[#00ff66]" : "text-[#E60000]"}`}>
                {coin.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="market" />
    </div>
  );
}
