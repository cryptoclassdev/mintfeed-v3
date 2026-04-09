import cron from "node-cron";
import { processArticles, processTwitterItems } from "./services/article-processor.service";
import { fetchMarketData } from "./services/coingecko.service";
import { refreshMarketPrices, backfillMarketMatches } from "./services/jupiter-prediction.service";
import { processExpoPushReceipts, cleanupOldSnapshots } from "./services/notification.service";

const consecutiveFailures = new Map<string, number>();

async function runJob(name: string, fn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await fn();
    consecutiveFailures.set(name, 0);
    const duration = Date.now() - start;
    if (duration > 30_000) {
      console.warn(`[Cron] ${name} took ${(duration / 1000).toFixed(1)}s (slow)`);
    }
  } catch (error) {
    const failures = (consecutiveFailures.get(name) ?? 0) + 1;
    consecutiveFailures.set(name, failures);
    console.error(`[Cron] ${name} failed (${failures} consecutive):`, error);
  }
}

export function startCronJobs(): void {
  // Fetch articles every 15 minutes (market matching happens inline)
  cron.schedule("*/15 * * * *", () => runJob("processArticles", processArticles));

  // Fetch crypto coin data every 5 minutes
  cron.schedule("*/5 * * * *", () => runJob("fetchMarketData", fetchMarketData));

  // Refresh prediction market prices every 5 minutes
  cron.schedule("*/5 * * * *", () => runJob("refreshMarketPrices", refreshMarketPrices));

  // Re-attempt matching for unmatched articles every 30 minutes
  cron.schedule("*/30 * * * *", () => runJob("backfillMarketMatches", backfillMarketMatches));

  // Fetch tweets every 15 minutes, staggered 7 minutes after RSS
  cron.schedule("7,22,37,52 * * * *", () => runJob("processTwitterItems", processTwitterItems));

  // Hourly: clean up old price snapshots + process Expo push receipts
  cron.schedule("0 * * * *", async () => {
    await Promise.allSettled([
      runJob("cleanupOldSnapshots", cleanupOldSnapshots),
      runJob("processExpoPushReceipts", processExpoPushReceipts),
    ]);
  });

  console.log("[Cron] Scheduled: articles (15min), twitter (15min staggered), market (5min), predictions (5min), backfill (30min), notifications (1h)");

  // Run initial fetch on startup
  setTimeout(async () => {
    console.log("[Cron] Running initial data fetch...");
    await Promise.allSettled([
      runJob("processArticles", processArticles),
      runJob("processTwitterItems", processTwitterItems),
      runJob("fetchMarketData", fetchMarketData),
      runJob("refreshMarketPrices", refreshMarketPrices),
    ]);
    await runJob("backfillMarketMatches", backfillMarketMatches);
  }, 2_000);
}
