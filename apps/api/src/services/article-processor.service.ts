import { createHash } from "node:crypto";
import { prisma } from "@mintfeed/db";
import { fetchAllFeeds, type ParsedFeedItem } from "./rss-fetcher.service";
import { fetchAllTwitterFeeds } from "./twitter-fetcher.service";
import { rewriteArticle } from "./gemini.service";
import { generateBlurhash } from "./image.service";
import { matchMarketForArticle } from "./jupiter-prediction.service";
import { broadcastNotification } from "./notification.service";
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

interface ProcessItemOptions {
  sourceType?: "RSS" | "TWITTER";
  tweetId?: string;
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Unique constraint");
}

async function processItem(item: ParsedFeedItem, options: ProcessItemOptions = {}): Promise<void> {
  const { sourceType = "RSS", tweetId } = options;

  const sourceUrlHash = hashUrl(item.link);
  const titleHash = hashTitle(item.title);

  // Quick title dedup check (non-unique field, so we keep this pre-check)
  const titleDuplicate = await prisma.article.findFirst({
    where: { titleHash },
    select: { id: true },
  });
  if (titleDuplicate) return;

  const { title, summary, breaking } = await rewriteArticle(item.title, item.content);
  const imageBlurhash = item.imageUrl
    ? await generateBlurhash(item.imageUrl)
    : null;

  let article;
  try {
    article = await prisma.article.create({
      data: {
        sourceUrl: item.link,
        sourceUrlHash,
        titleHash,
        sourceName: item.sourceName,
        category: item.category,
        originalTitle: item.title,
        originalBody: item.content,
        title,
        summary: truncateToWordLimit(summary, 60),
        imageUrl: item.imageUrl,
        imageBlurhash,
        isBreaking: breaking,
        publishedAt: new Date(item.pubDate),
        sourceType,
        tweetId: tweetId ?? null,
      },
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) return; // Duplicate caught by DB constraint
    throw error;
  }

  // Match prediction market in the background — don't block article processing
  matchMarketForArticle(article.id, item.title, title).catch((err) => {
    console.error(`[ArticleProcessor] Market matching failed for "${item.title.slice(0, 40)}":`, err);
  });

  // Send breaking news notification
  if (breaking) {
    broadcastNotification({
      type: "BREAKING_NEWS",
      title,
      body: truncateToWordLimit(summary, 20),
      imageUrl: item.imageUrl ?? undefined,
      data: { screen: "article", id: article.id },
      referenceId: article.id,
    }).catch((err) => {
      console.error(`[ArticleProcessor] Breaking notification failed:`, err);
    });
  }
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
      console.error(`[ArticleProcessor] Failed to process "${item.title}":`, error);
      skipped++;
    }
  }

  console.log(
    `[ArticleProcessor] Done. Processed: ${processed}, Skipped: ${skipped}`
  );
}

/** Extract tweetId from an x.com/twitter.com status URL */
function extractTweetId(url: string): string | null {
  const match = url.match(/(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/);
  return match?.[1] ?? null;
}

export async function processTwitterItems(): Promise<void> {
  console.log("[ArticleProcessor] Starting Twitter feed processing...");

  const items = await fetchAllTwitterFeeds();
  console.log(`[ArticleProcessor] Fetched ${items.length} items from Twitter`);

  let processed = 0;
  let skipped = 0;

  for (const item of items) {
    if (!item.link) {
      skipped++;
      continue;
    }

    const tweetId = extractTweetId(item.link);

    try {
      await processItem(item, { sourceType: "TWITTER", tweetId: tweetId ?? undefined });
      processed++;
    } catch (error) {
      console.error(`[ArticleProcessor] Failed to process tweet "${item.title.slice(0, 60)}":`, error);
      skipped++;
    }
  }

  console.log(
    `[ArticleProcessor] Twitter done. Processed: ${processed}, Skipped: ${skipped}`
  );
}
