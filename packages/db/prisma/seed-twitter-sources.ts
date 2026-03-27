import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const twitterSources = [
  // CRYPTO TIER_1 - Major news outlets and data platforms
  { handle: "WatcherGuru", displayName: "Watcher.Guru", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "Cointelegraph", displayName: "Cointelegraph", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "CoinDesk", displayName: "CoinDesk", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "TheBlockCo", displayName: "The Block", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "glassnode", displayName: "glassnode", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "unusual_whales", displayName: "unusual_whales", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "coinbureau", displayName: "Coin Bureau", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "KobeissiLetter", displayName: "The Kobeissi Letter", tier: "TIER_1" as const, category: "CRYPTO" as const },

  // CRYPTO TIER_2 - Prediction markets, analysts, niche feeds
  { handle: "Polymarket", displayName: "Polymarket", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "PolymarketTrade", displayName: "Polymarket Traders", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "MilkRoadAI", displayName: "Milk Road AI", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "DegenerateNews", displayName: "DEGEN NEWS", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "FabianoSolana", displayName: "fabiano.sol", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "intocryptoverse", displayName: "Benjamin Cowen", tier: "TIER_2" as const, category: "CRYPTO" as const },

  // AI TIER_1 - Major AI lab announcements
  { handle: "OpenAI", displayName: "OpenAI", tier: "TIER_1" as const, category: "AI" as const },
  { handle: "AnthropicAI", displayName: "Anthropic", tier: "TIER_1" as const, category: "AI" as const },
  { handle: "GoogleDeepMind", displayName: "Google DeepMind", tier: "TIER_1" as const, category: "AI" as const },
  { handle: "MetaAI", displayName: "Meta AI", tier: "TIER_1" as const, category: "AI" as const },

  // AI TIER_2 - Researchers, applied AI, and industry commentary
  { handle: "ai_breakfast", displayName: "AI Breakfast", tier: "TIER_2" as const, category: "AI" as const },
  { handle: "_akhaliq", displayName: "AK", tier: "TIER_2" as const, category: "AI" as const },
  { handle: "DrJimFan", displayName: "Jim Fan (AI Research)", tier: "TIER_2" as const, category: "AI" as const },
  { handle: "ylecun", displayName: "Yann LeCun", tier: "TIER_2" as const, category: "AI" as const },
  { handle: "karpathy", displayName: "Andrej Karpathy", tier: "TIER_2" as const, category: "AI" as const },
  { handle: "sama", displayName: "Sam Altman", tier: "TIER_2" as const, category: "AI" as const },
  { handle: "jacksonwarne", displayName: "Jackson Warner", tier: "TIER_2" as const, category: "AI" as const },
];

async function main() {
  console.log("Seeding Twitter sources...");

  for (const source of twitterSources) {
    await prisma.twitterSource.upsert({
      where: { handle: source.handle },
      update: {
        displayName: source.displayName,
        tier: source.tier,
        category: source.category,
      },
      create: source,
    });
    console.log(`  ✓ @${source.handle}`);
  }

  console.log(`\nSeeded ${twitterSources.length} Twitter sources.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
