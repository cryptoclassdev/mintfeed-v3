import ky from "ky";
import { prisma } from "@mintfeed/db";
import { TOP_COINS_COUNT } from "@mintfeed/shared";

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

    console.log(`[CoinGecko] Updated ${coins.length} coins`);
  } catch (error) {
    console.error("[CoinGecko] Failed to fetch market data:", error);
  }
}
