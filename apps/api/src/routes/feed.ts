import { Hono } from "hono";
import { prisma, Category } from "@midnight/db";
import {
  DEFAULT_PAGE_SIZE,
  dedupeArticlesByContent,
  isBinaryMarket,
} from "@midnight/shared";

export const feedRoutes = new Hono();

const ARTICLE_SELECT = {
  id: true,
  sourceUrl: true,
  sourceName: true,
  category: true,
  title: true,
  summary: true,
  originalTitle: true,
  imageUrl: true,
  imageBlurhash: true,
  sourceType: true,
  tweetId: true,
  publishedAt: true,
  createdAt: true,
} as const;

const ARTICLE_SELECT_WITH_PREDICTIONS = {
  ...ARTICLE_SELECT,
  predictionMarkets: {
    take: 3,
    include: {
      predictionMarket: {
        select: {
          id: true,
          question: true,
          outcomes: true,
          outcomePrices: true,
          marketUrl: true,
          volume: true,
          endDate: true,
        },
      },
    },
  },
} as const;

type ArticleWithPredictions = Awaited<
  ReturnType<typeof prisma.article.findMany<{ select: typeof ARTICLE_SELECT_WITH_PREDICTIONS }>>
>[number];

function mapArticle(article: ArticleWithPredictions) {
  const { predictionMarkets, ...rest } = article;
  const seen = new Set<string>();
  const markets = predictionMarkets
    .map((link) => link.predictionMarket)
    .filter((m) => isBinaryMarket(m.outcomes))
    .sort((a, b) => b.volume - a.volume)
    .filter((m) => {
      if (seen.has(m.question)) return false;
      seen.add(m.question);
      return true;
    })
    .map(({ outcomes: _, ...m }) => ({ ...m, endDate: m.endDate?.toISOString() ?? null }));
  return {
    ...rest,
    predictionMarkets: markets,
  };
}

function dedupeMappedArticles<T extends ReturnType<typeof mapArticle>>(articles: T[]): T[] {
  return dedupeArticlesByContent(articles);
}

const VALID_CATEGORIES = new Set(["all", "crypto", "ai"]);
const LEGACY_FALLBACK_SUMMARY_LENGTH = 300;
const FEED_SUMMARY_MIN_WORDS = 20;
const FEED_SCAN_BATCH_LIMIT = 150;
const FEED_SCAN_MAX_BATCHES = 20;

export function isFeedSummaryReady(summary: string) {
  const normalized = summary.trim();

  if (!normalized) return false;
  if (normalized.length === LEGACY_FALLBACK_SUMMARY_LENGTH) return false;
  if (!/[.!?]$/.test(normalized)) return false;

  return normalized.split(/\s+/).filter(Boolean).length >= FEED_SUMMARY_MIN_WORDS;
}

export function buildFeedWhere(categoryParam: string) {
  const feedReadyFilter = {
    imageUrl: { not: null },
    imageBlurhash: { not: null },
    summary: { not: "" },
  };

  return categoryParam === "all"
    ? feedReadyFilter
    : { category: categoryParam.toUpperCase() as Category, ...feedReadyFilter };
}

async function collectFeedPage<T extends { id: string; summary: string }>(
  limit: number,
  cursor: string | undefined,
  fetchBatch: (cursor: string | undefined, take: number) => Promise<T[]>,
) {
  const readyArticles: T[] = [];
  const batchSize = Math.min(Math.max(limit * 3, limit + 1), FEED_SCAN_BATCH_LIMIT);
  let rawCursor = cursor;
  let reachedEnd = false;

  for (let batchCount = 0; readyArticles.length <= limit && batchCount < FEED_SCAN_MAX_BATCHES; batchCount += 1) {
    const batch = await fetchBatch(rawCursor, batchSize + 1);
    const rawArticles = batch.length > batchSize ? batch.slice(0, batchSize) : batch;

    readyArticles.push(...rawArticles.filter((article) => isFeedSummaryReady(article.summary)));

    if (batch.length <= batchSize || rawArticles.length === 0) {
      reachedEnd = true;
      break;
    }

    rawCursor = rawArticles[rawArticles.length - 1]?.id;
  }

  const data = readyArticles.slice(0, limit);
  const scannedExtraReadyArticle = readyArticles.length > limit;
  const hasMore = scannedExtraReadyArticle || (!reachedEnd && data.length > 0);
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? rawCursor ?? null : null;

  return { data, nextCursor, hasMore };
}

feedRoutes.get("/feed", async (c) => {
  const categoryParam = (c.req.query("category") ?? "all").toLowerCase();
  const cursor = c.req.query("cursor");
  const rawLimit = Number(c.req.query("limit"));
  const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_PAGE_SIZE, 50);

  if (!VALID_CATEGORIES.has(categoryParam)) {
    return c.json({ error: "Invalid category. Must be: all, crypto, or ai" }, 400);
  }

  const where = buildFeedWhere(categoryParam);

  try {
    const page = await collectFeedPage(limit, cursor, (batchCursor, take) => {
      return prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take,
        ...(batchCursor && { cursor: { id: batchCursor }, skip: 1 }),
        select: ARTICLE_SELECT_WITH_PREDICTIONS,
      });
    });

    const data = dedupeMappedArticles(page.data.map(mapArticle));
    const nextCursor = page.hasMore ? data[data.length - 1]?.id ?? page.nextCursor : null;

    return c.json({ data, nextCursor, hasMore: page.hasMore });
  } catch (error) {
    // If the prediction markets relation fails (e.g. table not yet created),
    // fall back to serving articles without prediction data.
    console.error("[Feed] Query with predictions failed, retrying without:", (error as Error).message);
    try {
      const page = await collectFeedPage(limit, cursor, (batchCursor, take) => {
        return prisma.article.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          take,
          ...(batchCursor && { cursor: { id: batchCursor }, skip: 1 }),
          select: ARTICLE_SELECT,
        });
      });

      const data = dedupeArticlesByContent(page.data.map((a) => ({ ...a, predictionMarkets: [] })));
      const nextCursor = page.hasMore ? data[data.length - 1]?.id ?? page.nextCursor : null;

      return c.json({ data, nextCursor, hasMore: page.hasMore });
    } catch (fallbackError) {
      console.error("[Feed] Fallback query also failed:", (fallbackError as Error).message);
      return c.json({ data: [], nextCursor: null, hasMore: false });
    }
  }
});

feedRoutes.get("/feed/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        ...ARTICLE_SELECT,
        originalBody: true,
        predictionMarkets: {
          take: 3,
          include: {
            predictionMarket: {
              select: {
                id: true,
                question: true,
                outcomes: true,
                outcomePrices: true,
                marketUrl: true,
                volume: true,
                endDate: true,
              },
            },
          },
        },
      },
    });

    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

    const { predictionMarkets, ...rest } = article;
    const seen = new Set<string>();
    const markets = predictionMarkets
      .map((link) => link.predictionMarket)
      .filter((m) => isBinaryMarket(m.outcomes))
      .sort((a, b) => b.volume - a.volume)
      .filter((m) => {
        if (seen.has(m.question)) return false;
        seen.add(m.question);
        return true;
      })
      .map(({ outcomes: _, ...m }) => ({ ...m, endDate: m.endDate?.toISOString() ?? null }));
    return c.json({
      ...rest,
      predictionMarkets: markets,
    });
  } catch (error) {
    console.error("[Feed] GET /feed/:id error:", (error as Error).message);
    return c.json({ error: "Internal server error" }, 500);
  }
});
