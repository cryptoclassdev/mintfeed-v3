import cron from "node-cron";
import { processArticles } from "./services/article-processor.service";
import { fetchMarketData } from "./services/coingecko.service";
import { refreshMarketPrices, backfillMarketMatches } from "./services/jupiter-prediction.service";

export function startCronJobs(): void {
  // Fetch articles every 15 minutes (market matching happens inline)
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Running article fetch...");
    await processArticles();
  });

  // Fetch crypto coin data every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("[Cron] Running market data fetch...");
    await fetchMarketData();
  });

  // Refresh prediction market prices every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("[Cron] Refreshing prediction market prices...");
    await refreshMarketPrices();
  });

  // Re-attempt matching for unmatched articles every 30 minutes
  cron.schedule("*/30 * * * *", async () => {
    console.log("[Cron] Backfilling unmatched articles...");
    await backfillMarketMatches().catch((err) =>
      console.error("[Cron] Backfill failed:", err),
    );
  });

  console.log("[Cron] Scheduled: articles (15min), market (5min), predictions (5min), backfill (30min)");

  // Run initial fetch on startup
  setTimeout(async () => {
    console.log("[Cron] Running initial data fetch...");
    await Promise.allSettled([processArticles(), fetchMarketData(), refreshMarketPrices()]);
    // Backfill prediction market matches for articles that missed matching
    await backfillMarketMatches().catch((err) =>
      console.error("[Cron] Backfill failed:", err),
    );
  }, 2_000);
}
