import { Hono } from "hono";
import ky, { HTTPError } from "ky";
import type { SubmitSignedTransactionRequest } from "@mintfeed/shared";
import {
  USDC_MINT,
  CreateOrderSchema,
  ClosePositionSchema,
  ClaimPositionSchema,
  formatZodErrors,
} from "@mintfeed/shared";
import { prisma } from "@mintfeed/db";
import { relaySignedTransaction } from "../services/solana-relay.service";

const JUPITER_API_URL = "https://api.jup.ag/prediction/v1";

const jupiter = ky.create({
  prefixUrl: JUPITER_API_URL,
  headers: { "x-api-key": process.env.JUPITER_API_KEY ?? "" },
  timeout: 10_000,
  retry: { limit: 1 },
});

async function forwardJupiterError(err: unknown, c: any) {
  if (err instanceof HTTPError) {
    const status = err.response.status;
    const body = await err.response.json().catch(() => ({ message: err.message }));
    console.error("[Jupiter]", status, body);
    return c.json(body, status);
  }
  throw err;
}

export const predictionRoutes = new Hono();

// --- Markets ---

predictionRoutes.get("/predictions/markets/:marketId", async (c) => {
  const { marketId } = c.req.param();
  const data = await jupiter.get(`markets/${marketId}`).json<any>();
  // Reject non-binary markets
  if (!data?.pricing || data.pricing.buyYesPriceUsd <= 0 || data.pricing.buyNoPriceUsd <= 0) {
    return c.json({ error: "Market is not a binary Yes/No market" }, 404);
  }

  // Fall back to event-level volume when market pricing reports 0
  if (!data.pricing.volume || data.pricing.volume === 0) {
    const dbMarket = await prisma.predictionMarket.findUnique({
      where: { id: marketId },
      select: { eventId: true },
    });
    if (dbMarket?.eventId) {
      try {
        const event = await jupiter.get(`events/${dbMarket.eventId}`).json<any>();
        if (event?.volumeUsd) {
          data.pricing.volume = Number(event.volumeUsd);
        }
      } catch { /* keep 0 */ }
    }
  }

  return c.json(data);
});

predictionRoutes.get("/predictions/orderbook/:marketId", async (c) => {
  const { marketId } = c.req.param();
  const data = await jupiter.get(`orderbook/${marketId}`).json();
  return c.json(data);
});

// --- Trading Status ---

predictionRoutes.get("/predictions/trading-status", async (c) => {
  const data = await jupiter.get("trading-status").json();
  return c.json(data);
});

// --- Orders ---

predictionRoutes.post("/predictions/orders", async (c) => {
  const body = await c.req.json();
  const parsed = CreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: formatZodErrors(parsed.error) }, 400);
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
    const data = await jupiter.post("orders", { json: jupiterBody }).json();
    console.log("[Orders] Jupiter response:", JSON.stringify(data, null, 2));
    return c.json(data);
  } catch (err: any) {
    const raw = await err?.response?.text?.().catch(() => null);
    console.error("[Orders] Jupiter raw error:", err?.response?.status, raw);
    try {
      const parsed = JSON.parse(raw ?? "{}");
      console.error("[Orders] Jupiter parsed error:", parsed);
      return c.json(parsed, err?.response?.status ?? 500);
    } catch {
      return forwardJupiterError(err, c);
    }
  }
});

predictionRoutes.get("/predictions/orders", async (c) => {
  const params = Object.fromEntries(new URL(c.req.url).searchParams);
  const data = await jupiter.get("orders", { searchParams: params }).json();
  return c.json(data);
});

predictionRoutes.post("/predictions/transactions/submit", async (c) => {
  try {
    const body = await c.req.json<SubmitSignedTransactionRequest>();
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
  const params = Object.fromEntries(new URL(c.req.url).searchParams);
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

  return c.json({ ...data, data: enriched });
});

predictionRoutes.delete("/predictions/positions/:positionPubkey", async (c) => {
  const { positionPubkey } = c.req.param();
  const body = await c.req.json();
  const parsed = ClosePositionSchema.safeParse({ ...body, positionPubkey });
  if (!parsed.success) {
    return c.json({ error: formatZodErrors(parsed.error) }, 400);
  }
  try {
    const data = await jupiter
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
      .json();
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

  const results: Record<string, Record<string, number>> = {};
  await Promise.allSettled(
    marketIds.map(async (id) => {
      try {
        const market = await jupiter.get(`markets/${id}`).json<{
          pricing: { buyYesPriceUsd: number; buyNoPriceUsd: number };
        }>();
        results[id] = {
          Yes: Math.round((market.pricing.buyYesPriceUsd / 1_000_000) * 100) / 100,
          No: Math.round((market.pricing.buyNoPriceUsd / 1_000_000) * 100) / 100,
        };
      } catch { /* keep existing DB prices */ }
    }),
  );
  return c.json({ data: results });
});
