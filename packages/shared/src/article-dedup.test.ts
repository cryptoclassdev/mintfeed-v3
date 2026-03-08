import { describe, expect, it } from "vitest";
import { buildArticleContentKey, dedupeArticlesByContent } from "./article-dedup";
import type { Article, Category } from "./types";

function makeArticle(overrides: Partial<Article>): Article {
  return {
    id: "article-1",
    sourceUrl: "https://example.com/story",
    sourceName: "Example",
    category: "CRYPTO" as Category,
    title: "Bitcoin rally resumes after ETF inflows jump",
    summary: "Bitcoin climbed after ETF inflows accelerated and traders rotated back into risk assets.",
    originalTitle: "Bitcoin rally resumes after ETF inflows jump",
    imageUrl: null,
    imageBlurhash: null,
    publishedAt: "2026-03-08T00:00:00.000Z",
    createdAt: "2026-03-08T00:00:00.000Z",
    predictionMarkets: [],
    ...overrides,
  };
}

describe("buildArticleContentKey", () => {
  it("normalizes equivalent content into the same key", () => {
    const a = makeArticle({});
    const b = makeArticle({
      id: "article-2",
      title: "BITCOIN rally resumes after ETF inflows jump!!!",
      summary: "Bitcoin climbed after ETF inflows accelerated, and traders rotated back into risk assets.",
    });

    expect(buildArticleContentKey(a)).toBe(buildArticleContentKey(b));
  });

  it("uses originalTitle so rewritten display titles do not create duplicates", () => {
    const a = makeArticle({});
    const b = makeArticle({
      id: "article-2",
      title: "Bitcoin explodes as ETF demand returns",
      originalTitle: a.originalTitle,
    });

    expect(buildArticleContentKey(a)).toBe(buildArticleContentKey(b));
  });
});

describe("dedupeArticlesByContent", () => {
  it("keeps only the first article when content is identical", () => {
    const articles = [
      makeArticle({ id: "article-1" }),
      makeArticle({ id: "article-2", sourceUrl: "https://mirror.example.com/story" }),
      makeArticle({
        id: "article-3",
        title: "Ethereum l2 volumes spike",
        originalTitle: "Ethereum L2 volumes spike",
        summary: "Layer-2 activity climbed sharply as traders piled into new launches.",
      }),
    ];

    expect(dedupeArticlesByContent(articles).map((article) => article.id)).toEqual([
      "article-1",
      "article-3",
    ]);
  });
});
