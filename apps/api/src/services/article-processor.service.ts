import { createHash } from "node:crypto";
import { prisma } from "@mintfeed/db";
import { fetchAllFeeds, type ParsedFeedItem } from "./rss-fetcher.service";
import { rewriteArticle } from "./gemini.service";
import { generateBlurhash } from "./image.service";
import { matchMarketForArticle } from "./jupiter-prediction.service";

function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex");
}

async function processItem(item: ParsedFeedItem): Promise<void> {
  const sourceUrlHash = hashUrl(item.link);

  const exists = await prisma.article.findUnique({
    where: { sourceUrlHash },
    select: { id: true },
  });

  if (exists) return;

  const { title, summary } = await rewriteArticle(item.title, item.content);
  const imageBlurhash = item.imageUrl
    ? await generateBlurhash(item.imageUrl)
    : null;

  const article = await prisma.article.create({
    data: {
      sourceUrl: item.link,
      sourceUrlHash,
      sourceName: item.sourceName,
      category: item.category,
      originalTitle: item.title,
      originalBody: item.content,
      title,
      summary,
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
