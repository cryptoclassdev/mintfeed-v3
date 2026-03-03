import ky from "ky";
import { prisma } from "@mintfeed/db";

const JUPITER_API_URL = "https://api.jup.ag/prediction/v1";
const MIN_VOLUME_USD = 1000;
const MICRO_USD = 1_000_000;

const jupiterClient = ky.create({
  prefixUrl: JUPITER_API_URL,
  headers: {
    "x-api-key": process.env.JUPITER_API_KEY ?? "",
  },
  timeout: 8_000,
  retry: { limit: 1 },
});

// --- Jupiter API response types (actual API shape) ---

interface JupiterMarketPricing {
  buyYesPriceUsd: number; // micro-USD (e.g. 730000 = $0.73)
  buyNoPriceUsd: number;
  sellYesPriceUsd: number;
  sellNoPriceUsd: number;
  volume: number;
}

interface JupiterMarket {
  marketId: string;
  status: "open" | "closed" | "resolved";
  result: string | null;
  openTime: number;
  closeTime: number;
  metadata: {
    title: string;
    status: string;
  };
  pricing: JupiterMarketPricing;
}

interface JupiterEvent {
  eventId: string;
  isActive: boolean;
  category: string | null;
  volumeUsd: string; // micro-USD as string
  metadata: {
    title: string;
    imageUrl: string | null;
    closeTime: string | null;
  };
  markets: JupiterMarket[];
}

interface JupiterSearchResponse {
  data: JupiterEvent[];
  pagination: { total: number; hasNext: boolean };
}

// --- Helpers ---

function buildOutcomePrices(pricing: JupiterMarketPricing): Record<string, number> {
  const yesPrice = pricing.buyYesPriceUsd / MICRO_USD;
  const noPrice = pricing.buyNoPriceUsd / MICRO_USD;
  return {
    Yes: Math.round(yesPrice * 100) / 100,
    No: Math.round(noPrice * 100) / 100,
  };
}

function buildMarketUrl(eventId: string): string {
  return `https://app.jup.ag/prediction/${eventId}`;
}

// --- Exported functions ---

/**
 * Search Jupiter for a prediction market matching an article title.
 * Search returns events without market pricing, so we fetch the top
 * event individually to get its markets.
 */
export async function matchMarketForArticle(
  articleId: string,
  originalTitle: string,
  _rewrittenTitle?: string,
): Promise<void> {
  try {
    const response = await jupiterClient
      .get("events/search", {
        searchParams: { query: originalTitle.slice(0, 120), limit: 5 },
      })
      .json<JupiterSearchResponse>();

    const events = response.data ?? [];
    console.log(`[Jupiter] Search returned ${events.length} events for "${originalTitle.slice(0, 50)}"`);

    if (events.length === 0) {
      console.log(`[Jupiter] No match for "${originalTitle.slice(0, 50)}"`);
      return;
    }

    // Search results don't include market pricing — fetch each event individually
    for (const searchEvent of events) {
      if (!searchEvent.isActive) continue;

      let fullEvent: JupiterEvent;
      try {
        fullEvent = await jupiterClient
          .get(`events/${searchEvent.eventId}`)
          .json<JupiterEvent>();
      } catch {
        continue;
      }

      for (const market of fullEvent.markets) {
        if (market.status !== "open") continue;

        const pricing = market.pricing;
        if (!pricing || pricing.volume < MIN_VOLUME_USD) continue;

        const outcomePrices = buildOutcomePrices(pricing);
        const hasValidPrices = Object.values(outcomePrices).some((v) => v > 0);
        if (!hasValidPrices) continue;

        const eventMeta = fullEvent.metadata;
        const marketUrl = buildMarketUrl(fullEvent.eventId);
        const volumeUsd = Number(fullEvent.volumeUsd) / MICRO_USD;

        await prisma.predictionMarket.upsert({
          where: { id: market.marketId },
          update: {
            eventId: fullEvent.eventId,
            question: eventMeta.title,
            outcomePrices,
            outcomes: ["Yes", "No"],
            liquidity: volumeUsd,
            volume: pricing.volume,
            endDate: market.closeTime ? new Date(market.closeTime * 1000) : null,
            imageUrl: eventMeta.imageUrl,
            marketUrl,
            closed: false,
            category: fullEvent.category,
            result: market.result,
          },
          create: {
            id: market.marketId,
            eventId: fullEvent.eventId,
            question: eventMeta.title,
            outcomePrices,
            outcomes: ["Yes", "No"],
            liquidity: volumeUsd,
            volume: pricing.volume,
            endDate: market.closeTime ? new Date(market.closeTime * 1000) : null,
            imageUrl: eventMeta.imageUrl,
            marketUrl,
            closed: false,
            category: fullEvent.category,
            result: market.result,
          },
        });

        await prisma.articlePredictionMarket.upsert({
          where: { articleId_predictionMarketId: { articleId, predictionMarketId: market.marketId } },
          update: {},
          create: { articleId, predictionMarketId: market.marketId },
        });

        console.log(`[Jupiter] Matched: "${eventMeta.title.slice(0, 50)}..." for "${originalTitle.slice(0, 40)}"`);
        return;
      }
    }

    console.log(`[Jupiter] No open market with volume for "${originalTitle.slice(0, 50)}"`);
  } catch (error) {
    console.error(`[Jupiter] Search failed for "${originalTitle.slice(0, 40)}":`, (error as Error).message);
  }
}

/**
 * Backfill prediction market matches for articles that don't have one.
 */
export async function backfillMarketMatches(): Promise<void> {
  const unmatched = await prisma.article.findMany({
    where: { predictionMarkets: { none: {} } },
    select: { id: true, originalTitle: true, title: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  if (unmatched.length === 0) {
    console.log("[Jupiter] No unmatched articles to backfill");
    return;
  }

  console.log(`[Jupiter] Backfilling ${unmatched.length} articles...`);

  let matched = 0;
  for (const article of unmatched) {
    try {
      await matchMarketForArticle(article.id, article.originalTitle, article.title);
      const link = await prisma.articlePredictionMarket.findFirst({
        where: { articleId: article.id },
      });
      if (link) matched++;
    } catch (error) {
      console.error(`[Jupiter] Backfill failed for "${article.originalTitle.slice(0, 40)}":`, (error as Error).message);
    }
  }

  console.log(`[Jupiter] Backfilled ${matched}/${unmatched.length} articles`);
}

/**
 * Refresh outcomePrices for all active (non-closed) prediction markets.
 */
export async function refreshMarketPrices(): Promise<void> {
  const activeMarkets = await prisma.predictionMarket.findMany({
    where: { closed: false },
    select: { id: true, eventId: true, question: true },
  });

  if (activeMarkets.length === 0) {
    console.log("[Jupiter] No active markets to refresh");
    return;
  }

  console.log(`[Jupiter] Refreshing prices for ${activeMarkets.length} markets`);

  let updated = 0;
  for (const market of activeMarkets) {
    try {
      const fresh = await jupiterClient
        .get(`markets/${market.id}`)
        .json<JupiterMarket>();

      const outcomePrices = buildOutcomePrices(fresh.pricing);
      const hasValidPrices = Object.values(outcomePrices).some((v) => v > 0);
      if (!hasValidPrices) continue;

      await prisma.predictionMarket.update({
        where: { id: market.id },
        data: {
          outcomePrices,
          volume: fresh.pricing.volume,
          marketUrl: buildMarketUrl(market.eventId),
          closed: fresh.status !== "open",
          result: fresh.result,
        },
      });
      updated++;
    } catch {
      // API unreachable — keep existing prices
    }
  }

  console.log(`[Jupiter] Refreshed ${updated}/${activeMarkets.length} markets`);
}

/**
 * Fetch live prices for specific market IDs.
 * Tries Jupiter API first, falls back to DB-cached prices.
 */
export async function fetchLivePrices(
  marketIds: string[],
): Promise<Record<string, Record<string, number>>> {
  const results: Record<string, Record<string, number>> = {};

  await Promise.allSettled(
    marketIds.map(async (id) => {
      try {
        const market = await jupiterClient
          .get(`markets/${id}`)
          .json<JupiterMarket>();

        results[id] = buildOutcomePrices(market.pricing);
      } catch {
        // Will fall back to DB below
      }
    }),
  );

  // For any IDs not resolved by API, serve from DB
  const missing = marketIds.filter((id) => !results[id]);
  if (missing.length > 0) {
    const dbMarkets = await prisma.predictionMarket.findMany({
      where: { id: { in: missing } },
      select: { id: true, outcomePrices: true },
    });
    for (const m of dbMarkets) {
      const prices = m.outcomePrices as Record<string, number> | null;
      if (prices && Object.keys(prices).length > 0) {
        results[m.id] = prices;
      }
    }
  }

  return results;
}
