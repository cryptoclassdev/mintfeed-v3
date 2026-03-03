import { Hono } from "hono";
import { prisma, Category } from "@mintfeed/db";
import { DEFAULT_PAGE_SIZE } from "@mintfeed/shared";

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
  publishedAt: true,
  createdAt: true,
} as const;

const ARTICLE_SELECT_WITH_PREDICTIONS = {
  ...ARTICLE_SELECT,
  predictionMarkets: {
    take: 1,
    include: {
      predictionMarket: {
        select: {
          id: true,
          question: true,
          outcomePrices: true,
          marketUrl: true,
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
  return {
    ...rest,
    predictionMarket: predictionMarkets[0]?.predictionMarket ?? null,
  };
}

feedRoutes.get("/feed", async (c) => {
  const categoryParam = c.req.query("category") ?? "all";
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit")) || DEFAULT_PAGE_SIZE, 50);

  const where =
    categoryParam === "all"
      ? { imageUrl: { not: null } }
      : { category: categoryParam.toUpperCase() as Category, imageUrl: { not: null } };

  try {
    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: ARTICLE_SELECT_WITH_PREDICTIONS,
    });

    const hasMore = articles.length > limit;
    const raw = hasMore ? articles.slice(0, limit) : articles;
    const data = raw.map(mapArticle);
    const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

    return c.json({ data, nextCursor, hasMore });
  } catch (error) {
    // If the prediction markets relation fails (e.g. table not yet created),
    // fall back to serving articles without prediction data.
    console.error("[Feed] Query with predictions failed, retrying without:", (error as Error).message);
    try {
      const articles = await prisma.article.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        select: ARTICLE_SELECT,
      });

      const hasMore = articles.length > limit;
      const raw = hasMore ? articles.slice(0, limit) : articles;
      const data = raw.map((a) => ({ ...a, predictionMarket: null }));
      const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

      return c.json({ data, nextCursor, hasMore });
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
          take: 1,
          include: {
            predictionMarket: {
              select: {
                id: true,
                question: true,
                outcomePrices: true,
                marketUrl: true,
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
    return c.json({
      ...rest,
      predictionMarket: predictionMarkets[0]?.predictionMarket ?? null,
    });
  } catch (error) {
    console.error("[Feed] GET /feed/:id error:", (error as Error).message);
    return c.json({ error: "Internal server error" }, 500);
  }
});
