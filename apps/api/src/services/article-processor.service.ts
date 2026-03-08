import { createHash } from "node:crypto";
import { prisma } from "@mintfeed/db";
import { fetchAllFeeds, type ParsedFeedItem } from "./rss-fetcher.service";
import { rewriteArticle } from "./gemini.service";
import { generateBlurhash } from "./image.service";
import { matchMarketForArticle } from "./jupiter-prediction.service";
import { ARTICLE_SUMMARY_WORD_LIMIT } from "@mintfeed/shared";

function truncateToWordLimit(text: string, limit: number = ARTICLE_SUMMARY_WORD_LIMIT): string {
  const words = text.split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(" ");
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return url;
  }
}

function hashUrl(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex");
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hashTitle(title: string): string {
  return createHash("sha256").update(normalizeTitle(title)).digest("hex");
}

async function processItem(item: ParsedFeedItem): Promise<void> {
  const sourceUrlHash = hashUrl(item.link);

  const exists = await prisma.article.findUnique({
    where: { sourceUrlHash },
    select: { id: true },
  });

  if (exists) return;

  // Check for duplicate titles from different sources (same story, different outlet)
  const titleHash = hashTitle(item.title);
  const titleDuplicate = await prisma.article.findFirst({
    where: { titleHash },
    select: { id: true },
  });

  if (titleDuplicate) return;

  const { title, summary } = await rewriteArticle(item.title, item.content);
  const imageBlurhash = item.imageUrl
    ? await generateBlurhash(item.imageUrl)
    : null;

  const article = await prisma.article.create({
    data: {
      sourceUrl: item.link,
      sourceUrlHash,
      titleHash: hashTitle(item.title),
      sourceName: item.sourceName,
      category: item.category,
      originalTitle: item.title,
      originalBody: item.content,
      title,
      summary: truncateToWordLimit(summary, 60),
      imageUrl: item.imageUrl,
      imageBlurhash,
      publishedAt: new Date(item.pubDate),
    },
  });

  // Match prediction market in the background — don't block article processing
  matchMarketForArticle(article.id, item.title, title).catch((err) => {
    console.error(`[ArticleProcessor] Market matching failed for "${item.title.slice(0, 40)}":`, err);
  });
}

export { normalizeUrl, hashUrl, normalizeTitle, hashTitle };

export async function processArticles(): Promise<void> {
  console.log("[ArticleProcessor] Starting feed processing...");

  const items = await fetchAllFeeds();
  console.log(`[ArticleProcessor] Fetched ${items.length} items from RSS`);

  let processed = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.link) {
      skipped++;
      continue;
    }

    try {
      await processItem(item);
      processed++;
    } catch (error) {
      const isDuplicate =
        error instanceof Error &&
        error.message.includes("Unique constraint");
      if (isDuplicate) {
        skipped++;
      } else {
        console.error(`[ArticleProcessor] Failed to process "${item.title}":`, error);
      }
    }
  }

  console.log(
    `[ArticleProcessor] Done. Processed: ${processed}, Skipped: ${skipped}`
  );
}
