import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const twitterSources = [
  // CRYPTO TIER_1 - On-chain intelligence & protocol updates
  { handle: "lookonchain", displayName: "Lookonchain", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "whale_alert", displayName: "Whale Alert", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "JupiterExchange", displayName: "Jupiter", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "RaydiumProtocol", displayName: "Raydium", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "phantom", displayName: "Phantom", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "MagicEden", displayName: "Magic Eden", tier: "TIER_1" as const, category: "CRYPTO" as const },
  { handle: "solana", displayName: "Solana", tier: "TIER_1" as const, category: "CRYPTO" as const },

  // CRYPTO TIER_2 - Builders, analysts, and thought leaders
  { handle: "VitalikButerin", displayName: "Vitalik Buterin", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "CryptoHayes", displayName: "Arthur Hayes", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "zachxbt", displayName: "ZachXBT", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "CoinDesk", displayName: "CoinDesk", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "Cointelegraph", displayName: "Cointelegraph", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "TheBlock__", displayName: "The Block", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "dcbuilder", displayName: "DCBuilder", tier: "TIER_2" as const, category: "CRYPTO" as const },
  { handle: "MessariCrypto", displayName: "Messari", tier: "TIER_2" as const, category: "CRYPTO" as const },

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
