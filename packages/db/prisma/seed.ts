import { PrismaClient, Category } from "@prisma/client";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

const GAMMA_API_URL = "https://gamma-api.polymarket.com";
const MIN_LIQUIDITY = 5000;
const MARKETS_TO_SEED = 30;
const MARKETS_CACHE_FILE = join(__dirname, "markets-cache.json");

interface GammaMarket {
  conditionId: string;
  question: string;
  slug: string;
  outcomes: string | string[];
  outcomePrices: string | string[];
  liquidity: string;
  volume: string;
  endDateIso: string | null;
  image: string;
  closed: boolean;
  events?: { slug: string }[];
}

function curlJson<T>(url: string): T {
  const raw = execSync(`curl -s --connect-timeout 15 "${url}"`, {
    encoding: "utf-8",
    timeout: 20_000,
  });
  return JSON.parse(raw);
}

const FEED_SOURCES = [
  {
    url: "https://cointelegraph.com/rss",
    name: "CoinTelegraph RSS",
    category: Category.CRYPTO,
  },
  {
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    name: "CoinDesk RSS",
    category: Category.CRYPTO,
  },
  {
    url: "https://decrypt.co/feed",
    name: "Decrypt RSS",
    category: Category.CRYPTO,
  },
  {
    url: "https://thedefiant.io/feed",
    name: "The Defiant RSS",
    category: Category.CRYPTO,
  },
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    name: "TechCrunch AI",
    category: Category.AI,
  },
  {
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    name: "The Verge AI",
    category: Category.AI,
  },
  {
    url: "https://venturebeat.com/category/ai/feed/",
    name: "VentureBeat AI",
    category: Category.AI,
  },
];

// Step 1: Fetch markets from Gamma API and cache to local file (no DB needed)
function fetchAndCacheMarkets(): GammaMarket[] {
  const SEARCH_TOPICS = ["crypto", "bitcoin", "ethereum", "AI", "trump", "election"];
  const seenIds = new Set<string>();
  const allMarkets: GammaMarket[] = [];

  for (const topic of SEARCH_TOPICS) {
    if (allMarkets.length >= MARKETS_TO_SEED) break;

    try {
      const url = `${GAMMA_API_URL}/markets?text_query=${encodeURIComponent(topic)}&closed=false&liquidity_num_min=${MIN_LIQUIDITY}&limit=10&order=volume&ascending=false`;
      const markets = curlJson<GammaMarket[]>(url);
      console.log(`  Gamma returned ${markets.length} markets for "${topic}"`);

      for (const market of markets) {
        if (allMarkets.length >= MARKETS_TO_SEED) break;
        if (seenIds.has(market.conditionId)) continue;
        seenIds.add(market.conditionId);
        allMarkets.push(market);
      }
    } catch (error) {
      console.warn(`  Failed to fetch markets for "${topic}":`, error);
    }
  }

  writeFileSync(MARKETS_CACHE_FILE, JSON.stringify(allMarkets, null, 2));
  console.log(`  Cached ${allMarkets.length} markets to ${MARKETS_CACHE_FILE}`);
  return allMarkets;
}

async function main() {
  const mode = process.argv[2];

  // Step 1 only: fetch from Gamma, save to local file, no DB needed
  if (mode === "--fetch-only") {
    console.log("Fetching prediction markets from Polymarket Gamma API...");
    fetchAndCacheMarkets();
    console.log("Done. Run `pnpm db:seed` (without --fetch-only) to write to DB.");
    return;
  }

  // --- Seed feed sources ---
  console.log("Seeding feed sources...");
  for (const source of FEED_SOURCES) {
    await prisma.feedSource.upsert({
      where: { url: source.url },
      update: { name: source.name, category: source.category },
      create: source,
    });
    console.log(`  Upserted: ${source.name}`);
  }
  console.log("Feed sources seeded.\n");

  // --- Seed prediction markets ---
  console.log("Seeding prediction markets...");

  // First try Gamma API cache, then fall back to static seed data
  let gammaMarkets: GammaMarket[] = [];
  if (existsSync(MARKETS_CACHE_FILE)) {
    console.log("  Loading Gamma markets from cache...");
    gammaMarkets = JSON.parse(readFileSync(MARKETS_CACHE_FILE, "utf-8"));
  }

  let totalSeeded = 0;

  // Seed Gamma markets if available
  for (const market of gammaMarkets) {
    const outcomes: string[] = Array.isArray(market.outcomes)
      ? market.outcomes
      : JSON.parse(market.outcomes);
    const rawPrices: (string | number)[] = Array.isArray(market.outcomePrices)
      ? market.outcomePrices
      : JSON.parse(market.outcomePrices);
    const outcomePrices: Record<string, number> = {};
    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      const price = rawPrices[i];
      if (outcome != null && price != null) {
        outcomePrices[outcome] = typeof price === "number" ? price : parseFloat(price) || 0;
      }
    }

    const eventSlug = market.events?.[0]?.slug ?? market.slug;
    const marketUrl = `https://polymarket.com/event/${eventSlug}/${market.slug}`;

    await prisma.predictionMarket.upsert({
      where: { id: market.conditionId },
      update: {
        eventId: market.conditionId,
        question: market.question,
        outcomePrices,
        outcomes,
        liquidity: parseFloat(market.liquidity) || 0,
        volume: parseFloat(market.volume) || 0,
        endDate: market.endDateIso ? new Date(market.endDateIso) : null,
        imageUrl: market.image || null,
        marketUrl,
        closed: market.closed,
      },
      create: {
        id: market.conditionId,
        eventId: market.conditionId,
        question: market.question,
        outcomePrices,
        outcomes,
        liquidity: parseFloat(market.liquidity) || 0,
        volume: parseFloat(market.volume) || 0,
        endDate: market.endDateIso ? new Date(market.endDateIso) : null,
        imageUrl: market.image || null,
        marketUrl,
        closed: market.closed,
      },
    });

    console.log(`  Upserted Gamma market: "${market.question.slice(0, 60)}..."`);
    totalSeeded++;
  }

  console.log(`\nSeeded ${totalSeeded} prediction markets from Gamma API.`);
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
