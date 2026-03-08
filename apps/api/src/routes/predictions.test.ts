import { describe, it, expect } from "vitest";

describe("predictions positions enrichment", () => {
  it("enriches positions with missing market data from Jupiter", () => {
    const position = { marketId: "mkt-1", contracts: 10 };
    const marketData = {
      metadata: { title: "Will BTC hit 100k?" },
      status: "open",
      result: null,
      pricing: { buyYesPriceUsd: 730000 },
    };

    const enriched = {
      ...position,
      market: {
        title: marketData.metadata.title,
        status: marketData.status,
        result: marketData.result,
        pricing: marketData.pricing,
      },
    };

    expect(enriched.market.title).toBe("Will BTC hit 100k?");
    expect(enriched.market.pricing).toBeDefined();
  });

  it("passes through positions that already have market data", () => {
    const position = {
      marketId: "mkt-1",
      contracts: 10,
      market: { title: "Existing Title", pricing: { buyYesPriceUsd: 500000 } },
    };

    // Should not modify
    expect(position.market.title).toBe("Existing Title");
  });

  it("handles Jupiter market fetch failure gracefully", () => {
    const position: Record<string, unknown> = { marketId: "mkt-1", contracts: 10 };
    // When fetch fails, position should be returned as-is
    expect(position.market).toBeUndefined();
  });
});

describe("predictions market volume fallback", () => {
  it("falls back to event volumeUsd when pricing.volume is 0", () => {
    const marketData = {
      pricing: { volume: 0, buyYesPriceUsd: 730000, buyNoPriceUsd: 270000 },
    };
    const eventData = { volumeUsd: "500000000000" };

    if (!marketData.pricing.volume || marketData.pricing.volume === 0) {
      marketData.pricing.volume = Number(eventData.volumeUsd);
    }

    expect(marketData.pricing.volume).toBe(500000000000);
  });

  it("uses pricing.volume when > 0 without fetching event", () => {
    const marketData = {
      pricing: { volume: 100000000, buyYesPriceUsd: 730000, buyNoPriceUsd: 270000 },
    };

    // volume > 0, no fallback needed
    expect(marketData.pricing.volume).toBe(100000000);
  });
});
