import ky from "ky";
import { prisma } from "@mintfeed/db";
import { TOP_COINS_COUNT } from "@mintfeed/shared";
import { broadcastNotification } from "./notification.service";

const COINGECKO_API_URL =
  process.env.COINGECKO_API_URL ?? "https://api.coingecko.com/api/v3";

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable = error?.code === "P1001" || error?.code === "P1002";
      if (isRetryable && attempt < MAX_RETRIES) {
        console.warn(`[${label}] DB connection failed, retrying (${attempt}/${MAX_RETRIES})...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unreachable");
}

export async function fetchMarketData(): Promise<void> {
  console.log("[CoinGecko] Fetching market data...");

  try {
    const coins = await ky
      .get(`${COINGECKO_API_URL}/coins/markets`, {
        searchParams: {
          vs_currency: "usd",
          order: "market_cap_desc",
          per_page: TOP_COINS_COUNT,
          page: 1,
          sparkline: false,
        },
        timeout: 15_000,
        retry: { limit: 2 },
      })
      .json<CoinGeckoMarket[]>();

    await withRetry(
      () =>
        prisma.$transaction(
          coins.map((coin) =>
            prisma.marketCoin.upsert({
              where: { id: coin.id },
              update: {
                currentPrice: coin.current_price,
                priceChange24h: coin.price_change_percentage_24h ?? 0,
                marketCap: coin.market_cap,
                imageUrl: coin.image,
              },
              create: {
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                currentPrice: coin.current_price,
                priceChange24h: coin.price_change_percentage_24h ?? 0,
                marketCap: coin.market_cap,
                imageUrl: coin.image,
              },
            }),
          ),
        ),
      "CoinGecko",
    );

    // Remove coins that dropped out of the top list
    const currentIds = coins.map((c) => c.id);
    await withRetry(
      () => prisma.marketCoin.deleteMany({ where: { id: { notIn: currentIds } } }),
      "CoinGecko:cleanup",
    );

    console.log(`[CoinGecko] Updated ${coins.length} coins`);

    // Write price snapshots + detect market movers
    await recordSnapshotsAndDetectMovers(coins);
  } catch (error) {
    console.error("[CoinGecko] Failed to fetch market data:", error);
  }
}

const MOVER_THRESHOLD = 0.05; // 5%
const MOVER_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours per coin
const TOP_N_FOR_MOVERS = 10;

async function recordSnapshotsAndDetectMovers(coins: CoinGeckoMarket[]): Promise<void> {
  const topCoins = coins.slice(0, TOP_N_FOR_MOVERS);

  // Write current price snapshots
  await prisma.coinPriceSnapshot.createMany({
    data: topCoins.map((coin) => ({
      coinId: coin.id,
      price: coin.current_price,
    })),
  });

  // Compare against 1-hour-old snapshots
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  for (const coin of topCoins) {
    const oldSnapshot = await prisma.coinPriceSnapshot.findFirst({
      where: { coinId: coin.id, takenAt: { lte: oneHourAgo } },
      orderBy: { takenAt: "desc" },
      select: { price: true },
    });

    if (!oldSnapshot || oldSnapshot.price === 0) continue;

    const changePercent = (coin.current_price - oldSnapshot.price) / oldSnapshot.price;
    const absChange = Math.abs(changePercent);

    if (absChange < MOVER_THRESHOLD) continue;

    const direction = changePercent > 0 ? "surged" : "dropped";
    const changeStr = (absChange * 100).toFixed(1);
    const priceStr = coin.current_price.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: coin.current_price < 1 ? 4 : 0,
    });

    const symbol = coin.symbol.toUpperCase();

    broadcastNotification({
      type: "MARKET_MOVER",
      title: `${symbol} ${direction} ${changeStr}% in the last hour`,
      body: `Now trading at ${priceStr}`,
      imageUrl: coin.image,
      data: { screen: "market" },
      referenceId: `mover:${coin.id}:${Math.floor(Date.now() / MOVER_COOLDOWN_MS)}`,
    }).catch((err) => {
      console.error(`[CoinGecko] Market mover notification failed for ${symbol}:`, err);
    });
  }
}
