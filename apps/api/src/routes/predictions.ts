import { Hono } from "hono";
import type { Context } from "hono";
import ky, { HTTPError } from "ky";
import type { SubmitSignedTransactionRequest } from "@midnight/shared";
import {
  USDC_MINT,
  CreateOrderSchema,
  ClosePositionSchema,
  ClaimPositionSchema,
  formatZodErrors,
} from "@midnight/shared";
import { prisma } from "@midnight/db";
import { relaySignedTransaction } from "../services/solana-relay.service";
import { jupiterCache, type LoadStatus } from "../services/jupiter-cache";
import {
  fetchLivePrices,
  pauseBackgroundPredictionReadsForMs,
} from "../services/jupiter-prediction.service";

const JUPITER_API_URL = "https://api.jup.ag/prediction/v1";

const jupiter = ky.create({
  prefixUrl: JUPITER_API_URL,
  headers: { "x-api-key": process.env.JUPITER_API_KEY ?? "" },
  timeout: 10_000,
  retry: { limit: 1 },
});

async function forwardJupiterError(err: unknown, c: Context) {
  if (err instanceof HTTPError) {
    const status = err.response.status;
    const retryAfterSeconds = status === 429
      ? getJupiterRetryAfterSeconds(err.response.headers)
      : null;
    const body = await err.response.json().catch(() => null) as { message?: string } | null;
    console.error("[Jupiter]", status, body);
    if (status === 429) {
      if (retryAfterSeconds) {
        c.header("Retry-After", String(retryAfterSeconds));
      }
      return c.json(
        {
          error: retryAfterSeconds
            ? `Prediction markets are rate limited. Retry in ${retryAfterSeconds}s.`
            : "Prediction markets are temporarily rate limited. Please try again shortly.",
          code: "JUPITER_RATE_LIMITED",
          retryAfterSeconds,
        },
        429,
      );
    }
    const message = typeof body?.message === "string" ? body.message : "Request failed. Please try again.";
    return c.json(
      { error: message },
      (status >= 400 && status < 500 ? status : 502) as 400 | 401 | 403 | 404 | 429 | 502,
    );
  }
  console.error("[Jupiter] Non-HTTP error:", err);
  return c.json({ error: "Service temporarily unavailable" }, 502);
}

function setCacheStatus(c: Context, status: LoadStatus): void {
  c.header("X-Cache", status);
}

function isFreshReadRequested(c: Context): boolean {
  const value = c.req.query("fresh");
  return value === "1" || value === "true";
}

const MICRO_USD = 1_000_000;
const DEFAULT_PREDICTION_MIN_TRADE_USD = 1;

type PredictionMarketSnapshot = {
  id: string;
  question: string;
  outcomePrices: unknown;
  volume: number;
  endDate: Date | null;
  closed: boolean;
  result: string | null;
};

export function getPredictionMinimumTradeUsd(
  env: Record<string, string | undefined> = process.env,
): number {
  const raw = Number(env.PREDICTION_MIN_TRADE_USD);
  if (Number.isFinite(raw) && raw >= DEFAULT_PREDICTION_MIN_TRADE_USD) {
    return raw;
  }

  return DEFAULT_PREDICTION_MIN_TRADE_USD;
}

function readOutcomePrice(outcomePrices: unknown, side: "Yes" | "No"): number {
  if (!outcomePrices || typeof outcomePrices !== "object") return 0;
  const raw = (outcomePrices as Record<string, unknown>)[side];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}

function hasSnapshotPrices(snapshot: PredictionMarketSnapshot): boolean {
  return readOutcomePrice(snapshot.outcomePrices, "Yes") > 0
    && readOutcomePrice(snapshot.outcomePrices, "No") > 0;
}

export function buildPredictionMarketDetailFromSnapshot(snapshot: PredictionMarketSnapshot) {
  const yesUsd = readOutcomePrice(snapshot.outcomePrices, "Yes");
  const noUsd = readOutcomePrice(snapshot.outcomePrices, "No");
  const buyYesPriceUsd = Math.round(yesUsd * MICRO_USD);
  const buyNoPriceUsd = Math.round(noUsd * MICRO_USD);

  return {
    marketId: snapshot.id,
    status: snapshot.closed ? "closed" : "open",
    result: snapshot.result,
    openTime: 0,
    closeTime: snapshot.endDate ? Math.floor(snapshot.endDate.getTime() / 1000) : 0,
    resolveAt: null,
    metadata: {
      title: snapshot.question,
    },
    pricing: {
      buyYesPriceUsd,
      buyNoPriceUsd,
      sellYesPriceUsd: buyYesPriceUsd,
      sellNoPriceUsd: buyNoPriceUsd,
      volume: snapshot.volume,
    },
  };
}

async function fetchLivePredictionMarketDetail(marketId: string) {
  const data = await jupiter.get(`markets/${marketId}`).json<any>();

  if (!data?.pricing || data.pricing.buyYesPriceUsd <= 0 || data.pricing.buyNoPriceUsd <= 0) {
    throw new NonBinaryMarketError();
  }

  const { title, rulesPrimary, ...rest } = data;
  return {
    ...rest,
    metadata: {
      title: title ?? "Market",
      rulesPrimary: rulesPrimary ?? undefined,
    },
  };
}

export function getJupiterRetryAfterSeconds(headers: Headers, nowMs = Date.now()): number | null {
  const retryAfter = headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds);
    }

    const at = Date.parse(retryAfter);
    if (Number.isFinite(at)) {
      return Math.max(1, Math.ceil((at - nowMs) / 1000));
    }
  }

  const reset = Number(headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    return Math.max(1, Math.ceil(reset - (nowMs / 1000)));
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withPredictionWriteRetry<T>(
  run: () => Promise<T>,
): Promise<T> {
  let attempt = 0;

  while (attempt < 3) {
    try {
      return await run();
    } catch (error) {
      if (!(error instanceof HTTPError) || error.response.status !== 429 || attempt === 2) {
        throw error;
      }

      const retryAfterSeconds = getJupiterRetryAfterSeconds(error.response.headers) ?? 1;
      const retryDelayMs = Math.min((retryAfterSeconds + 1) * 1000, 5_000);

      pauseBackgroundPredictionReadsForMs(retryDelayMs);
      await sleep(retryDelayMs);
      attempt += 1;
    }
  }

  throw new Error("Prediction write retry loop exhausted");
}

// Per-endpoint freshness budgets. On loader failure within these budgets the
// cache falls back to the last successful value and sets X-Cache: stale. Long
// enough to absorb Jupiter's 429 bursts; short enough that a refreshed order
// book isn't stale for perceptible periods.
const TTL_MARKET_MS = 5_000;
const TTL_ORDERBOOK_MS = 5_000;
const TTL_TRADING_STATUS_MS = 60_000;
const TTL_PER_WALLET_MS = 60_000;

export const predictionRoutes = new Hono();

// --- Markets ---

const EVENT_VOLUME_TTL_MS = 60_000;
const eventVolumeCache = new Map<string, { value: number; expiresAt: number }>();

async function fetchEventVolume(eventId: string): Promise<number | null> {
  const cached = eventVolumeCache.get(eventId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const event = await jupiter.get(`events/${eventId}`).json<any>();
    const volume = event?.volumeUsd ? Number(event.volumeUsd) : 0;
    eventVolumeCache.set(eventId, { value: volume, expiresAt: Date.now() + EVENT_VOLUME_TTL_MS });
    return volume;
  } catch {
    return null;
  }
}

predictionRoutes.get("/predictions/markets/:marketId", async (c) => {
  const { marketId } = c.req.param();
  const fresh = isFreshReadRequested(c);
  try {
    if (fresh) {
      c.header("X-Cache", "live");
      return c.json(await fetchLivePredictionMarketDetail(marketId));
    }

    const dbMarket = await prisma.predictionMarket.findUnique({
      where: { id: marketId },
      select: {
        id: true,
        question: true,
        outcomePrices: true,
        volume: true,
        endDate: true,
        closed: true,
        result: true,
      },
    }).catch(() => null);

    if (dbMarket && hasSnapshotPrices(dbMarket)) {
      c.header("X-Cache", "db");
      return c.json(buildPredictionMarketDetailFromSnapshot(dbMarket));
    }

    const { value, status } = await jupiterCache.fetch(
      `market:${marketId}`,
      TTL_MARKET_MS,
      async () => {
        // Fetch market and DB record in parallel — the DB record only feeds the
        // event-volume fallback, so overlapping it with the Jupiter round-trip
        // hides the extra latency.
        const [data, dbMarket] = await Promise.all([
          fetchLivePredictionMarketDetail(marketId),
          prisma.predictionMarket.findUnique({
            where: { id: marketId },
            select: { eventId: true },
          }).catch(() => null),
        ]);

        // Fall back to cached event-level volume when market pricing reports 0
        if ((!data.pricing.volume || data.pricing.volume === 0) && dbMarket?.eventId) {
          const eventVolume = await fetchEventVolume(dbMarket.eventId);
          if (eventVolume && eventVolume > 0) {
            data.pricing.volume = eventVolume;
          }
        }
        return data;
      },
    );
    setCacheStatus(c, status);
    return c.json(value);
  } catch (err) {
    if (err instanceof NonBinaryMarketError) {
      return c.json({ error: "Market is not a binary Yes/No market" }, 404);
    }
    return forwardJupiterError(err, c);
  }
});

class NonBinaryMarketError extends Error {
  constructor() {
    super("non-binary market");
    this.name = "NonBinaryMarketError";
  }
}

predictionRoutes.get("/predictions/orderbook/:marketId", async (c) => {
  const { marketId } = c.req.param();
  try {
    const { value, status } = await jupiterCache.fetch(
      `orderbook:${marketId}`,
      TTL_ORDERBOOK_MS,
      () => jupiter.get(`orderbook/${marketId}`).json(),
    );
    setCacheStatus(c, status);
    return c.json(value as object);
  } catch (err) {
    return forwardJupiterError(err, c);
  }
});

// --- Trading Status ---

predictionRoutes.get("/predictions/trading-status", async (c) => {
  try {
    const minimumOrderUsd = getPredictionMinimumTradeUsd();
    const { value, status } = await jupiterCache.fetch(
      "trading-status",
      TTL_TRADING_STATUS_MS,
      () => jupiter.get("trading-status").json(),
    );
    setCacheStatus(c, status);
    return c.json({
      ...(value as object),
      minimum_order_usd: minimumOrderUsd,
    });
  } catch (err) {
    return forwardJupiterError(err, c);
  }
});

// --- Orders ---

predictionRoutes.post("/predictions/orders", async (c) => {
  const body = await c.req.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: formatZodErrors(parsed.error) }, 400);
  }
  const minimumOrderUsd = getPredictionMinimumTradeUsd();
  if (parsed.data.isBuy && parsed.data.depositAmount) {
    const depositUsd = Number(parsed.data.depositAmount) / MICRO_USD;
    if (depositUsd < minimumOrderUsd) {
      return c.json({ error: `Minimum order is $${minimumOrderUsd}` }, 400);
    }
  }
  // Jupiter accepts depositAmount/contracts as string | number.
  // Convert numeric strings to numbers to match their preferred format.
  const jupiterBody: Record<string, unknown> = { ...parsed.data };
  if (typeof jupiterBody.depositAmount === "string") {
    jupiterBody.depositAmount = Number(jupiterBody.depositAmount);
  }
  if (typeof jupiterBody.contracts === "string") {
    jupiterBody.contracts = Number(jupiterBody.contracts);
  }

  console.log("[Orders] Request body:", JSON.stringify(jupiterBody, null, 2));
  try {
    const data = await withPredictionWriteRetry(
      () => jupiter.post("orders", { json: jupiterBody }).json(),
    );
    console.log("[Orders] Jupiter response:", JSON.stringify(data, null, 2));
    return c.json(data);
  } catch (err: any) {
    const raw = await err?.response?.clone?.().text?.().catch(() => null);
    console.error("[Orders] Jupiter error:", err?.response?.status, raw);
    return forwardJupiterError(err, c);
  }
});

predictionRoutes.get("/predictions/orders", async (c) => {
  const url = new URL(c.req.url);
  const params = Object.fromEntries(url.searchParams);
  delete params.fresh;
  const fresh = isFreshReadRequested(c);
  try {
    if (fresh) {
      c.header("X-Cache", "live");
      return c.json(await jupiter.get("orders", { searchParams: params }).json());
    }

    const { value, status } = await jupiterCache.fetch(
      `orders:${url.search}`,
      TTL_PER_WALLET_MS,
      () => jupiter.get("orders", { searchParams: params }).json(),
    );
    setCacheStatus(c, status);
    return c.json(value as object);
  } catch (err) {
    return forwardJupiterError(err, c);
  }
});

predictionRoutes.post("/predictions/transactions/submit", async (c) => {
  try {
    const body = await c.req.json<SubmitSignedTransactionRequest>();
    // Legacy endpoint for older mobile builds that still rely on server-side
    // rebroadcast. Newer builds send prediction transactions directly from the
    // wallet and only use the API for unsigned transaction creation.
    const result = await relaySignedTransaction(body);
    return c.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction broadcast failed. Try again.";
    console.error("[Solana Relay]", message);
    return c.json({ message }, 502);
  }
});

// --- Positions ---

predictionRoutes.get("/predictions/positions", async (c) => {
  const url = new URL(c.req.url);
  const params = Object.fromEntries(url.searchParams);
  delete params.fresh;
  const fresh = isFreshReadRequested(c);
  try {
    const loadPositions = async () => {
      const data = await jupiter.get("positions", { searchParams: params }).json<any>();

      // Normalize positions: use event title (the actual question) and map field names
      const positions = data?.data ?? [];
      const enriched = positions.map((pos: any) => {
        // Use eventMetadata.title (the question) instead of market.title (the outcome name "Yes"/"No")
        const title = pos.eventMetadata?.title ?? pos.market?.title ?? "Unknown Market";
        return {
          ...pos,
          // Map Jupiter's totalCostUsd to costBasisUsd for the client
          costBasisUsd: pos.costBasisUsd ?? pos.totalCostUsd ?? "0",
          market: {
            ...pos.market,
            title,
            status: pos.marketMetadata?.status ?? pos.market?.status ?? "open",
            result: pos.marketMetadata?.result ?? pos.market?.result ?? null,
            pricing: pos.market?.pricing,
          },
        };
      });

      return { ...data, data: enriched };
    };

    if (fresh) {
      c.header("X-Cache", "live");
      return c.json(await loadPositions());
    }

    const { value, status } = await jupiterCache.fetch(
      `positions:${url.search}`,
      TTL_PER_WALLET_MS,
      loadPositions,
    );
    setCacheStatus(c, status);
    return c.json(value as object);
  } catch (err) {
    return forwardJupiterError(err, c);
  }
});

predictionRoutes.delete("/predictions/positions/:positionPubkey", async (c) => {
  const { positionPubkey } = c.req.param();
  const body = await c.req.json();
  const parsed = ClosePositionSchema.safeParse({ ...body, positionPubkey });
  if (!parsed.success) {
    return c.json({ error: formatZodErrors(parsed.error) }, 400);
  }
  try {
    const data = await withPredictionWriteRetry(
      () => jupiter
        .post("orders", {
          json: {
            ownerPubkey: parsed.data.ownerPubkey,
            positionPubkey,
            isBuy: false,
            isYes: parsed.data.isYes,
            contracts: parsed.data.contracts,
            depositMint: USDC_MINT,
          },
        })
        .json(),
    );
    return c.json(data);
  } catch (err) {
    return forwardJupiterError(err, c);
  }
});

predictionRoutes.delete("/predictions/positions", async (c) => {
  const { ownerPubkey } = await c.req.json<{ ownerPubkey: string }>();
  try {
    const positionsResp = await jupiter
      .get("positions", { searchParams: { ownerPubkey } })
      .json<{ data: { pubkey: string; isYes: boolean; contracts: string }[] }>();
    const positions = positionsResp.data ?? [];

    const results = await Promise.all(
      positions.map((pos) =>
        jupiter
          .post("orders", {
            json: {
              ownerPubkey,
              positionPubkey: pos.pubkey,
              isBuy: false,
              isYes: pos.isYes,
              contracts: pos.contracts,
              depositMint: USDC_MINT,
            },
          })
          .json(),
      ),
    );
    return c.json(results);
  } catch (err) {
    return forwardJupiterError(err, c);
  }
});

predictionRoutes.post("/predictions/positions/:positionPubkey/claim", async (c) => {
  const { positionPubkey } = c.req.param();
  const body = await c.req.json();
  const parsed = ClaimPositionSchema.safeParse({ ...body, positionPubkey });
  if (!parsed.success) {
    return c.json({ error: formatZodErrors(parsed.error) }, 400);
  }
  try {
    // Pass depositMint to ensure USDC payout (not jupUSD)
    const data = await jupiter
      .post(`positions/${positionPubkey}/claim`, {
        json: { ownerPubkey: parsed.data.ownerPubkey, depositMint: USDC_MINT },
      })
      .json();
    return c.json(data);
  } catch (err) {
    return forwardJupiterError(err, c);
  }
});

// --- Live prices (for inline article cards) ---

predictionRoutes.get("/predictions/live", async (c) => {
  const idsParam = c.req.query("ids") ?? "";
  const marketIds = idsParam.split(",").filter(Boolean);
  if (marketIds.length === 0) return c.json({ data: {} });

  const results = await fetchLivePrices(marketIds);
  return c.json({ data: results });
});
