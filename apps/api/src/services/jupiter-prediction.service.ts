import ky, { HTTPError } from "ky";
import { prisma } from "@midnight/db";
import { sendSettlementNotification } from "./notification.service";

const JUPITER_API_URL = "https://api.jup.ag/prediction/v1";
const MIN_VOLUME_USD = 1000;
const MICRO_USD = 1_000_000;
const BACKGROUND_PREDICTION_WINDOW_MS = 10_000;
const BACKGROUND_PREDICTION_REQUEST_LIMIT = 2;
const BACKGROUND_PREDICTION_FALLBACK_COOLDOWN_MS = 30_000;
const BACKFILL_ARTICLE_LIMIT = 4;

const jupiterClient = ky.create({
  prefixUrl: JUPITER_API_URL,
  headers: {
    "x-api-key": process.env.JUPITER_API_KEY ?? "",
  },
  timeout: 8_000,
  retry: { limit: 1 },
});

let backgroundWindowStartedAt = 0;
let backgroundRequestsUsed = 0;
let backgroundCooldownUntil = 0;

function resetBackgroundWindow(now: number): void {
  if (backgroundWindowStartedAt === 0 || now - backgroundWindowStartedAt >= BACKGROUND_PREDICTION_WINDOW_MS) {
    backgroundWindowStartedAt = now;
    backgroundRequestsUsed = 0;
  }
}

function getCooldownFromHeaders(headers: Headers | undefined, now = Date.now()): number {
  if (!headers) return BACKGROUND_PREDICTION_FALLBACK_COOLDOWN_MS;

  const retryAfter = headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }

    const at = Date.parse(retryAfter);
    if (Number.isFinite(at) && at > now) {
      return at - now;
    }
  }

  const resetAt = Number(headers.get("x-ratelimit-reset"));
  if (Number.isFinite(resetAt) && resetAt > 0) {
    return Math.max(1_000, Math.ceil((resetAt * 1000) - now));
  }

  return BACKGROUND_PREDICTION_FALLBACK_COOLDOWN_MS;
}

function canUseBackgroundPredictionBudget(now = Date.now()): boolean {
  resetBackgroundWindow(now);
  if (now < backgroundCooldownUntil) return false;
  if (backgroundRequestsUsed >= BACKGROUND_PREDICTION_REQUEST_LIMIT) return false;
  backgroundRequestsUsed += 1;
  return true;
}

function pauseBackgroundPredictionReads(headers?: Headers): void {
  const now = Date.now();
  const cooldownMs = getCooldownFromHeaders(headers, now);
  backgroundCooldownUntil = Math.max(backgroundCooldownUntil, now + cooldownMs);
}

function logBackgroundBudgetSkip(label: string): void {
  const now = Date.now();
  if (now < backgroundCooldownUntil) {
    const seconds = Math.max(1, Math.ceil((backgroundCooldownUntil - now) / 1000));
    console.warn(`[Jupiter] Skipping ${label}; background reads paused for ${seconds}s`);
    return;
  }
  console.warn(`[Jupiter] Skipping ${label}; background request budget exhausted for this window`);
}

async function loadBackgroundPrediction<T>(
  label: string,
  loader: () => Promise<T>,
): Promise<T | null> {
  if (!canUseBackgroundPredictionBudget()) {
    logBackgroundBudgetSkip(label);
    return null;
  }

  try {
    return await loader();
  } catch (error) {
    if (error instanceof HTTPError && error.response.status === 429) {
      pauseBackgroundPredictionReads(error.response.headers);
      logBackgroundBudgetSkip(label);
      return null;
    }
    throw error;
  }
}

// --- Jupiter API response types (actual API shape) ---

interface JupiterMarketPricing {
  buyYesPriceUsd: number; // micro-USD (e.g. 730000 = $0.73)
  buyNoPriceUsd: number;
  sellYesPriceUsd: number;
  sellNoPriceUsd: number;
  volume: number; // plain USD (NOT micro-USD)
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

const MAX_MARKETS_PER_ARTICLE = 3;

/**
 * Search Jupiter for up to 3 prediction markets matching an article title.
 * Search returns events without market pricing, so we fetch each event
 * individually to get its markets with pricing data.
 */
export async function matchMarketForArticle(
  articleId: string,
  originalTitle: string,
  _rewrittenTitle?: string,
): Promise<void> {
  try {
    // Check how many markets already linked — skip if already at cap
    const existingLinks = await prisma.articlePredictionMarket.findMany({
      where: { articleId },
      include: { predictionMarket: { select: { id: true, question: true } } },
    });
    const existingIds = new Set(existingLinks.map((l) => l.predictionMarketId));
    const existingQuestions = new Set(existingLinks.map((l) => l.predictionMarket.question));
    const slotsRemaining = MAX_MARKETS_PER_ARTICLE - existingIds.size;

    if (slotsRemaining <= 0) return;

    const response = await loadBackgroundPrediction(
        `match search for "${originalTitle.slice(0, 40)}"`,
        () => jupiterClient
          .get("events/search", {
          searchParams: { query: originalTitle.slice(0, 120), limit: 2 },
        })
        .json<JupiterSearchResponse>(),
    );
    if (!response) return;

    const events = response.data ?? [];
    console.log(`[Jupiter] Search returned ${events.length} events for "${originalTitle.slice(0, 50)}"`);

    if (events.length === 0) {
      console.log(`[Jupiter] No match for "${originalTitle.slice(0, 50)}"`);
      return;
    }

    // Collect valid markets across all events, excluding already-linked ones
    const candidates: Array<{ market: JupiterMarket; event: JupiterEvent }> = [];
    const seenQuestions = new Set(existingQuestions);

    for (const searchEvent of events) {
      if (!searchEvent.isActive) continue;

      let fullEvent: JupiterEvent;
      const loadedEvent = await loadBackgroundPrediction(
        `load event ${searchEvent.eventId}`,
        () => jupiterClient
          .get(`events/${searchEvent.eventId}`)
          .json<JupiterEvent>(),
      );
      if (!loadedEvent) break;
      fullEvent = loadedEvent;

      // Only binary events — single-market events are true Yes/No questions
      if (fullEvent.markets.length !== 1) continue;

      for (const market of fullEvent.markets) {
        if (market.status !== "open") continue;
        if (existingIds.has(market.marketId)) continue;

        // Deduplicate by event title — no repeated questions per article
        const question = fullEvent.metadata.title;
        if (seenQuestions.has(question)) continue;

        const pricing = market.pricing;
        // Skip non-binary markets (must have both yes and no prices > 0)
        if (!pricing || pricing.buyYesPriceUsd <= 0 || pricing.buyNoPriceUsd <= 0) continue;
        if (pricing.volume < MIN_VOLUME_USD) continue;

        const outcomePrices = buildOutcomePrices(pricing);
        const hasValidPrices = Object.values(outcomePrices).some((v) => v > 0);
        if (!hasValidPrices) continue;

        seenQuestions.add(question);
        candidates.push({ market, event: fullEvent });
      }
    }

    if (candidates.length === 0) {
      console.log(`[Jupiter] No new open markets for "${originalTitle.slice(0, 50)}"`);
      return;
    }

    // Take top markets by volume, only filling remaining slots
    candidates.sort((a, b) => b.market.pricing.volume - a.market.pricing.volume);
    const topMarkets = candidates.slice(0, slotsRemaining);

    let matched = 0;
    for (const { market, event } of topMarkets) {
      const outcomePrices = buildOutcomePrices(market.pricing);
      const eventMeta = event.metadata;
      const marketUrl = buildMarketUrl(event.eventId);
      const volumeUsd = Number(event.volumeUsd) / MICRO_USD;

      await prisma.predictionMarket.upsert({
        where: { id: market.marketId },
        update: {
          eventId: event.eventId,
          question: eventMeta.title,
          outcomePrices,
          outcomes: ["Yes", "No"],
          liquidity: volumeUsd,
          volume: market.pricing.volume,
          endDate: market.closeTime ? new Date(market.closeTime * 1000) : null,
          imageUrl: eventMeta.imageUrl,
          marketUrl,
          closed: false,
          category: event.category,
          result: market.result,
        },
        create: {
          id: market.marketId,
          eventId: event.eventId,
          question: eventMeta.title,
          outcomePrices,
          outcomes: ["Yes", "No"],
          liquidity: volumeUsd,
          volume: market.pricing.volume,
          endDate: market.closeTime ? new Date(market.closeTime * 1000) : null,
          imageUrl: eventMeta.imageUrl,
          marketUrl,
          closed: false,
          category: event.category,
          result: market.result,
        },
      });

      await prisma.articlePredictionMarket.upsert({
        where: { articleId_predictionMarketId: { articleId, predictionMarketId: market.marketId } },
        update: {},
        create: { articleId, predictionMarketId: market.marketId },
      });

      matched++;
      console.log(`[Jupiter] Matched ${matched}/${topMarkets.length}: "${eventMeta.title.slice(0, 50)}..." for "${originalTitle.slice(0, 40)}"`);
    }

    console.log(`[Jupiter] Linked ${matched} new markets to "${originalTitle.slice(0, 40)}" (total: ${existingIds.size + matched})`);
  } catch (error) {
    console.error(`[Jupiter] Search failed for "${originalTitle.slice(0, 40)}":`, (error as Error).message);
  }
}

/**
 * Backfill prediction market matches for articles with fewer than 3 markets.
 */
export async function backfillMarketMatches(): Promise<void> {
  // Find articles with fewer than MAX_MARKETS_PER_ARTICLE linked markets
  const undermatched = await prisma.$queryRaw<Array<{ id: string; originalTitle: string; title: string; linkCount: bigint }>>`
    SELECT a.id, a."originalTitle", a.title, COUNT(apm.id)::bigint AS "linkCount"
    FROM "Article" a
    LEFT JOIN "ArticlePredictionMarket" apm ON apm."articleId" = a.id
    GROUP BY a.id
    HAVING COUNT(apm.id) < ${MAX_MARKETS_PER_ARTICLE}
    ORDER BY a."publishedAt" DESC
    LIMIT ${BACKFILL_ARTICLE_LIMIT}
  `;

  if (undermatched.length === 0) {
    console.log("[Jupiter] No articles to backfill");
    return;
  }

  console.log(`[Jupiter] Backfilling ${undermatched.length} articles (< ${MAX_MARKETS_PER_ARTICLE} markets)...`);

  let improved = 0;
  for (const article of undermatched) {
    const beforeCount = Number(article.linkCount);
    try {
      await matchMarketForArticle(article.id, article.originalTitle, article.title);
      const afterCount = await prisma.articlePredictionMarket.count({
        where: { articleId: article.id },
      });
      if (afterCount > beforeCount) improved++;
    } catch (error) {
      console.error(`[Jupiter] Backfill failed for "${article.originalTitle.slice(0, 40)}":`, (error as Error).message);
    }
  }

  console.log(`[Jupiter] Backfilled: ${improved}/${undermatched.length} articles gained new markets`);
}

/**
 * Refresh outcomePrices for all active (non-closed) prediction markets.
 */
export async function refreshMarketPrices(): Promise<void> {
  const duplicateGroups = await prisma.predictionMarket.groupBy({
    by: ["eventId"],
    _count: { eventId: true },
    where: { closed: false },
  });
  const duplicateEventIds = duplicateGroups
    .filter((group) => group._count.eventId > 1)
    .map((group) => group.eventId);

  if (duplicateEventIds.length > 0) {
    await prisma.predictionMarket.updateMany({
      where: {
        closed: false,
        eventId: { in: duplicateEventIds },
      },
      data: { closed: true },
    });
    console.log(`[Jupiter] Closed stale multi-market rows for ${duplicateEventIds.length} event IDs`);
  }

  const activeMarkets = await prisma.predictionMarket.findMany({
    where: { closed: false },
    orderBy: { updatedAt: "asc" },
    take: BACKGROUND_PREDICTION_REQUEST_LIMIT,
    select: { id: true, eventId: true, question: true, result: true },
  });

  if (activeMarkets.length === 0) {
    console.log("[Jupiter] No active markets to refresh");
    return;
  }

  console.log(`[Jupiter] Refreshing prices for ${activeMarkets.length} markets`);

  let updated = 0;
  for (const market of activeMarkets) {
    try {
      const fresh = await loadBackgroundPrediction(
        `refresh market ${market.id}`,
        () => jupiterClient
          .get(`markets/${market.id}`)
          .json<JupiterMarket>(),
      );
      if (!fresh) break;

      // Skip if market lost binary pricing
      if (!fresh.pricing || fresh.pricing.buyYesPriceUsd <= 0 || fresh.pricing.buyNoPriceUsd <= 0) {
        await prisma.predictionMarket.update({
          where: { id: market.id },
          data: { closed: true },
        });
        continue;
      }

      const outcomePrices = buildOutcomePrices(fresh.pricing);
      const hasValidPrices = Object.values(outcomePrices).some((v) => v > 0);
      if (!hasValidPrices) continue;

      const wasOpen = market.result === null;
      const justSettled = wasOpen && fresh.result !== null;

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

      // Notify users whose bets just settled
      if (justSettled) {
        notifySettlement(market.id, market.question, fresh.result!).catch((err) => {
          console.error(`[Jupiter] Settlement notification failed for "${market.question.slice(0, 40)}":`, err);
        });
      }
    } catch {
      // API unreachable — keep existing prices
    }
  }

  console.log(`[Jupiter] Refreshed ${updated}/${activeMarkets.length} markets`);
}

/**
 * Notify all wallet holders who have registered devices about a settlement.
 */
async function notifySettlement(marketId: string, question: string, result: string): Promise<void> {
  const devices = await prisma.pushDevice.findMany({
    where: { walletAddress: { not: null }, isActive: true },
    select: { walletAddress: true },
    distinct: ["walletAddress"],
  });

  for (const device of devices) {
    if (!device.walletAddress) continue;
    await sendSettlementNotification({
      walletAddress: device.walletAddress,
      marketId,
      question,
      result,
    });
  }
}

/**
 * Fetch live prices for specific market IDs from our DB snapshot.
 * Runtime reads should not consume the shared Jupiter quota.
 */
export async function fetchLivePrices(
  marketIds: string[],
): Promise<Record<string, Record<string, number>>> {
  const results: Record<string, Record<string, number>> = {};

  const dbMarkets = await prisma.predictionMarket.findMany({
    where: { id: { in: marketIds } },
    select: { id: true, outcomePrices: true },
  });
  for (const market of dbMarkets) {
    const prices = market.outcomePrices as Record<string, number> | null;
    if (prices && Object.keys(prices).length > 0) {
      results[market.id] = prices;
    }
  }

  return results;
}
