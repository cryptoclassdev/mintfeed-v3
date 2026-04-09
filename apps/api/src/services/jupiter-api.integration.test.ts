/**
 * Jupiter Prediction Market API Integration Tests
 *
 * Tests every Jupiter endpoint we proxy through our backend.
 * Runs against the live staging API — no mocks.
 *
 * Usage:
 *   pnpm --filter api test -- --testPathPattern jupiter-api.integration
 *
 * Requires:
 *   STAGING_API_URL env var (defaults to staging)
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  CreateOrderSchema,
  ClosePositionSchema,
  ClaimPositionSchema,
  USDC_MINT,
} from "@mintfeed/shared";

const API_URL =
  process.env.STAGING_API_URL ?? "https://mintfeed-api-staging.up.railway.app";

const PREDICTION_BASE = `${API_URL}/api/v1/predictions`;

// A dummy pubkey that passes Base58 validation but owns nothing
const DUMMY_PUBKEY = "11111111111111111111111111111112";

// Populated in beforeAll from live feed data
let activeMarketId: string;
let allMarketIds: string[];

async function fetchJson<T = unknown>(url: string, init?: RequestInit): Promise<{ status: number; data: T }> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => null) as T;
  return { status: res.status, data };
}

// ─── Setup: discover live market IDs from feed ───────────────────────────────

beforeAll(async () => {
  const { data } = await fetchJson<{ data: Array<{ predictionMarkets?: Array<{ id: string; closed?: boolean; volume?: number }> }> }>(
    `${API_URL}/api/v1/feed?limit=20`,
  );
  const markets = (data?.data ?? [])
    .flatMap((a) => a.predictionMarkets ?? [])
    .filter((m) => !m.closed);

  // Pick the highest-volume open market for order tests
  markets.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
  allMarketIds = markets.map((m) => m.id);

  expect(allMarketIds.length).toBeGreaterThan(0);
  activeMarketId = allMarketIds[0];
  console.log(`Using active market: ${activeMarketId} (${allMarketIds.length} total)`);
}, 15_000);

// ─── 1. Market Data ─────────────────────────────────────────────────────────

describe("GET /predictions/markets/:id", () => {
  it("returns pricing for an active market", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/markets/${activeMarketId}`);

    expect(status).toBe(200);
    expect(data.pricing).toBeDefined();
    expect(data.pricing.buyYesPriceUsd).toBeGreaterThan(0);
    expect(data.pricing.buyNoPriceUsd).toBeGreaterThan(0);

    // Yes + No should roughly sum to 1.0 (micro-USD, so ~1_000_000)
    const sum = (data.pricing.buyYesPriceUsd + data.pricing.buyNoPriceUsd) / 1_000_000;
    expect(sum).toBeGreaterThan(0.85);
    expect(sum).toBeLessThan(1.15);
  });

  it("returns sell prices alongside buy prices", async () => {
    const { data } = await fetchJson<any>(`${PREDICTION_BASE}/markets/${activeMarketId}`);

    expect(data.pricing.sellYesPriceUsd).toBeDefined();
    expect(data.pricing.sellNoPriceUsd).toBeDefined();
    // Sell price should be <= buy price (spread)
    expect(data.pricing.sellYesPriceUsd).toBeLessThanOrEqual(data.pricing.buyYesPriceUsd);
    expect(data.pricing.sellNoPriceUsd).toBeLessThanOrEqual(data.pricing.buyNoPriceUsd);
  });

  it("returns volume as a number (not micro-USD)", async () => {
    const { data } = await fetchJson<any>(`${PREDICTION_BASE}/markets/${activeMarketId}`);
    const volume = data.pricing.volume;

    expect(typeof volume).toBe("number");
    // Volume in USD should be reasonable (not in micro-USD range)
    // If volume were micro-USD, a $10k market would show as 10_000_000_000
    // We expect plain USD: e.g. 10000 for $10k
    if (volume > 0) {
      expect(volume).toBeLessThan(1_000_000_000); // Under $1B in plain USD
    }
  });

  it("returns 4xx or 5xx for a nonexistent market ID", async () => {
    const { status } = await fetchJson(`${PREDICTION_BASE}/markets/NONEXISTENT-MARKET-ID-12345`);
    // Should be 404 or 502, NOT 200
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("returns metadata with title", async () => {
    const { data } = await fetchJson<any>(`${PREDICTION_BASE}/markets/${activeMarketId}`);
    // Jupiter returns metadata.title OR we derive it
    const hasTitle = data.metadata?.title || data.title || data.question;
    expect(hasTitle).toBeTruthy();
  });
});

// ─── 2. Order Book ──────────────────────────────────────────────────────────

describe("GET /predictions/orderbook/:id", () => {
  it("returns yes and no price levels for an active market", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orderbook/${activeMarketId}`);

    expect(status).toBe(200);
    expect(Array.isArray(data.yes)).toBe(true);
    expect(Array.isArray(data.no)).toBe(true);
  });

  it("price levels are [price, size] pairs", async () => {
    const { data } = await fetchJson<any>(`${PREDICTION_BASE}/orderbook/${activeMarketId}`);

    if (data.yes.length > 0) {
      const [price, size] = data.yes[0];
      expect(typeof price).toBe("number");
      expect(typeof size).toBe("number");
      expect(price).toBeGreaterThanOrEqual(0);
      expect(size).toBeGreaterThan(0);
    }
  });

  it("returns dollar-formatted levels alongside raw levels", async () => {
    const { data } = await fetchJson<any>(`${PREDICTION_BASE}/orderbook/${activeMarketId}`);

    // Jupiter may or may not include these
    if (data.yes_dollars) {
      expect(Array.isArray(data.yes_dollars)).toBe(true);
    }
  });
});

// ─── 3. Trading Status ──────────────────────────────────────────────────────

describe("GET /predictions/trading-status", () => {
  it("returns a trading_active boolean", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/trading-status`);

    expect(status).toBe(200);
    expect(typeof data.trading_active).toBe("boolean");
  });
});

// ─── 4. Create Order — Validation ───────────────────────────────────────────

describe("POST /predictions/orders (validation)", () => {
  it("rejects buy order below minimum trade amount ($1)", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ownerPubkey: DUMMY_PUBKEY,
        marketId: activeMarketId,
        isYes: true,
        isBuy: true,
        depositAmount: "500000", // $0.50 — below $1 minimum
        depositMint: USDC_MINT,
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("Minimum trade");
  });

  it("rejects buy order missing marketId", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ownerPubkey: DUMMY_PUBKEY,
        isYes: true,
        isBuy: true,
        depositAmount: "5000000",
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("marketId");
  });

  it("rejects buy order missing depositAmount", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ownerPubkey: DUMMY_PUBKEY,
        marketId: activeMarketId,
        isYes: true,
        isBuy: true,
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("depositAmount");
  });

  it("rejects sell order missing positionPubkey", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ownerPubkey: DUMMY_PUBKEY,
        isYes: true,
        isBuy: false,
        contracts: "5",
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("positionPubkey");
  });

  it("rejects sell order missing contracts", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ownerPubkey: DUMMY_PUBKEY,
        positionPubkey: DUMMY_PUBKEY,
        isYes: true,
        isBuy: false,
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("contracts");
  });

  it("rejects invalid pubkey format", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ownerPubkey: "not-a-valid-pubkey!!!",
        marketId: activeMarketId,
        isYes: true,
        isBuy: true,
        depositAmount: "5000000",
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("public key");
  });

  it("rejects empty request body", async () => {
    const { status } = await fetchJson(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: "{}",
    });

    expect(status).toBe(400);
  });

  it("rejects depositAmount with decimal (must be integer string)", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/orders`, {
      method: "POST",
      body: JSON.stringify({
        ownerPubkey: DUMMY_PUBKEY,
        marketId: activeMarketId,
        isYes: true,
        isBuy: true,
        depositAmount: "5000000.50",
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("depositAmount");
  });
});

// ─── 5. Close Position — Validation ─────────────────────────────────────────

describe("DELETE /predictions/positions/:id (validation)", () => {
  it("rejects close with invalid pubkeys", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/positions/bad-pubkey`, {
      method: "DELETE",
      body: JSON.stringify({
        ownerPubkey: "also-bad",
        isYes: true,
        contracts: "5",
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("rejects close with zero contracts", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/positions/${DUMMY_PUBKEY}`, {
      method: "DELETE",
      body: JSON.stringify({
        ownerPubkey: DUMMY_PUBKEY,
        isYes: true,
        contracts: "0",
      }),
    });

    expect(status).toBe(400);
    expect(data.error).toContain("contracts");
  });
});

// ─── 6. Fetch Positions ─────────────────────────────────────────────────────

describe("GET /predictions/positions", () => {
  it("returns empty array for a wallet with no positions", async () => {
    const { status, data } = await fetchJson<any>(
      `${PREDICTION_BASE}/positions?ownerPubkey=${DUMMY_PUBKEY}`,
    );

    expect(status).toBe(200);
    expect(data.data).toEqual([]);
    expect(data.pagination).toBeDefined();
  });

  it("returns pagination metadata", async () => {
    const { data } = await fetchJson<any>(
      `${PREDICTION_BASE}/positions?ownerPubkey=${DUMMY_PUBKEY}`,
    );

    expect(data.pagination).toMatchObject({
      total: expect.any(Number),
      hasNext: expect.any(Boolean),
    });
  });
});

// ─── 7. Claim Position — Validation ─────────────────────────────────────────

describe("POST /predictions/positions/:id/claim (validation)", () => {
  it("rejects claim with invalid pubkey", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/positions/bad-key/claim`, {
      method: "POST",
      body: JSON.stringify({ ownerPubkey: "also-bad" }),
    });

    expect(status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

// ─── 8. Transaction Relay — Validation ──────────────────────────────────────

describe("POST /predictions/transactions/submit (validation)", () => {
  it("rejects invalid base64 transaction", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/transactions/submit`, {
      method: "POST",
      body: JSON.stringify({
        signedTransaction: "not-valid-base64-transaction",
        txMeta: { blockhash: "abc", lastValidBlockHeight: 0 },
      }),
    });

    expect(status).toBe(502);
    expect(data.message).toContain("deserialize");
  });
});

// ─── 9. Live Prices ─────────────────────────────────────────────────────────

describe("GET /predictions/live", () => {
  it("returns prices in 0-1 USD range for valid market IDs", async () => {
    const ids = allMarketIds.slice(0, 3).join(",");
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/live?ids=${ids}`);

    expect(status).toBe(200);
    expect(data.data).toBeDefined();

    for (const [marketId, prices] of Object.entries<any>(data.data)) {
      expect(prices.Yes).toBeGreaterThanOrEqual(0);
      expect(prices.Yes).toBeLessThanOrEqual(1);
      expect(prices.No).toBeGreaterThanOrEqual(0);
      expect(prices.No).toBeLessThanOrEqual(1);

      // Yes + No should be close to 1.0
      const sum = prices.Yes + prices.No;
      expect(sum).toBeGreaterThan(0.85);
      expect(sum).toBeLessThan(1.15);
    }
  });

  it("silently skips invalid market IDs", async () => {
    const { status, data } = await fetchJson<any>(
      `${PREDICTION_BASE}/live?ids=${activeMarketId},FAKE-MARKET-999`,
    );

    expect(status).toBe(200);
    expect(data.data[activeMarketId]).toBeDefined();
    expect(data.data["FAKE-MARKET-999"]).toBeUndefined();
  });

  it("returns empty object for no IDs", async () => {
    const { status, data } = await fetchJson<any>(`${PREDICTION_BASE}/live?ids=`);

    expect(status).toBe(200);
    expect(data.data).toEqual({});
  });
});

// ─── 10. Feed Price Consistency ─────────────────────────────────────────────

describe("Feed prediction market data quality", () => {
  it("all markets in feed have valid Yes/No outcome prices", async () => {
    const { data } = await fetchJson<any>(`${API_URL}/api/v1/feed?limit=20`);
    const articles = data?.data ?? [];
    const issues: string[] = [];

    for (const article of articles) {
      for (const pm of article.predictionMarkets ?? []) {
        const yes = pm.outcomePrices?.Yes ?? 0;
        const no = pm.outcomePrices?.No ?? 0;

        if (yes === 0 && no === 0) {
          issues.push(`${pm.id}: both prices are 0`);
        }
        if (yes < 0 || no < 0) {
          issues.push(`${pm.id}: negative price (Yes=${yes}, No=${no})`);
        }
        if (yes > 1 || no > 1) {
          issues.push(`${pm.id}: price > 1.0 (Yes=${yes}, No=${no})`);
        }

        const sum = yes + no;
        if (sum > 0 && (sum < 0.8 || sum > 1.2)) {
          issues.push(`${pm.id}: Yes+No=${sum.toFixed(2)} (expected ~1.0)`);
        }
      }
    }

    if (issues.length > 0) {
      console.warn("Price issues found:", issues);
    }
    // Allow up to 10% of markets to have issues (stale data is possible)
    const totalMarkets = articles.flatMap((a: any) => a.predictionMarkets ?? []).length;
    const issueRate = totalMarkets > 0 ? issues.length / totalMarkets : 0;
    expect(issueRate).toBeLessThan(0.1);
  });

  it("live prices match feed prices within reasonable tolerance", { timeout: 15_000 }, async () => {
    const { data: feedData } = await fetchJson<any>(`${API_URL}/api/v1/feed?limit=5`);
    const feedMarkets = (feedData?.data ?? [])
      .flatMap((a: any) => a.predictionMarkets ?? [])
      .filter((m: any) => !m.closed)
      .slice(0, 3);

    if (feedMarkets.length === 0) return; // skip if no markets

    const ids = feedMarkets.map((m: any) => m.id).join(",");
    const { data: liveData } = await fetchJson<any>(`${PREDICTION_BASE}/live?ids=${ids}`);

    for (const fm of feedMarkets) {
      const live = liveData?.data?.[fm.id];
      if (!live) continue; // Jupiter may be temporarily unavailable

      const feedYes = fm.outcomePrices?.Yes ?? 0;
      const liveYes = live.Yes;

      // Allow 10% tolerance between cached feed prices and live prices
      const diff = Math.abs(feedYes - liveYes);
      if (feedYes > 0) {
        expect(diff).toBeLessThan(0.15); // 15 cent tolerance
      }
    }
  });
});

// ─── 11. Schema Validation Unit Tests ───────────────────────────────────────

describe("CreateOrderSchema validation", () => {
  it("accepts a valid buy order", () => {
    const result = CreateOrderSchema.safeParse({
      ownerPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      marketId: "POLY-123",
      isYes: true,
      isBuy: true,
      depositAmount: "5000000",
      depositMint: USDC_MINT,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid sell order", () => {
    const result = CreateOrderSchema.safeParse({
      ownerPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      positionPubkey: "8mZSt6hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      isYes: false,
      isBuy: false,
      contracts: "10",
    });
    expect(result.success).toBe(true);
  });

  it("rejects deposit below $1 minimum", () => {
    const result = CreateOrderSchema.safeParse({
      ownerPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      marketId: "POLY-123",
      isYes: true,
      isBuy: true,
      depositAmount: "999999", // $0.999999
    });
    expect(result.success).toBe(false);
  });

  it("rejects contracts with leading zero", () => {
    const result = CreateOrderSchema.safeParse({
      ownerPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      positionPubkey: "8mZSt6hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      isYes: true,
      isBuy: false,
      contracts: "05",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative deposit amount", () => {
    const result = CreateOrderSchema.safeParse({
      ownerPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      marketId: "POLY-123",
      isYes: true,
      isBuy: true,
      depositAmount: "-5000000",
    });
    expect(result.success).toBe(false);
  });
});

describe("ClosePositionSchema validation", () => {
  it("accepts valid close request", () => {
    const result = ClosePositionSchema.safeParse({
      positionPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      ownerPubkey: "8mZSt6hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      isYes: true,
      contracts: "5",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero contracts", () => {
    const result = ClosePositionSchema.safeParse({
      positionPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      ownerPubkey: "8mZSt6hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      isYes: true,
      contracts: "0",
    });
    expect(result.success).toBe(false);
  });
});

describe("ClaimPositionSchema validation", () => {
  it("accepts valid claim request", () => {
    const result = ClaimPositionSchema.safeParse({
      positionPubkey: "7nYSt5hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
      ownerPubkey: "8mZSt6hJEzFCJqzXJEfbH3CfeRfqSPFHHB9KxGdCZxK4",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid pubkey", () => {
    const result = ClaimPositionSchema.safeParse({
      positionPubkey: "bad",
      ownerPubkey: "also-bad",
    });
    expect(result.success).toBe(false);
  });
});
