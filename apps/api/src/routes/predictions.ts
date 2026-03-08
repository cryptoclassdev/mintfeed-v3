import { Hono } from "hono";
import ky, { HTTPError } from "ky";

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
  console.log("[Orders] Request body:", JSON.stringify(body, null, 2));
  try {
    const data = await jupiter.post("orders", { json: body }).json();
    console.log("[Orders] Jupiter response:", JSON.stringify(data, null, 2));
    return c.json(data);
  } catch (err: any) {
    const raw = await err?.response?.text?.().catch(() => null);
    console.error("[Orders] Jupiter raw error:", err?.response?.status, raw);
    // Re-read body for forwarding since .text() consumed it — parse from raw
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

// --- Positions ---

predictionRoutes.get("/predictions/positions", async (c) => {
  const params = Object.fromEntries(new URL(c.req.url).searchParams);
  const data = await jupiter.get("positions", { searchParams: params }).json();
  return c.json(data);
});

predictionRoutes.delete("/predictions/positions/:positionPubkey", async (c) => {
  const { positionPubkey } = c.req.param();
  const body = await c.req.json();
  const data = await jupiter.delete(`positions/${positionPubkey}`, { json: body }).json();
  return c.json(data);
});

predictionRoutes.delete("/predictions/positions", async (c) => {
  const body = await c.req.json();
  const data = await jupiter.delete("positions", { json: body }).json();
  return c.json(data);
});

predictionRoutes.post("/predictions/positions/:positionPubkey/claim", async (c) => {
  const { positionPubkey } = c.req.param();
  const body = await c.req.json();
  const data = await jupiter.post(`positions/${positionPubkey}/claim`, { json: body }).json();
  return c.json(data);
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
