import { describe, expect, it } from "vitest";
import {
  buildPredictionMarketDetailFromSnapshot,
  getPredictionMinimumTradeUsd,
  getJupiterRetryAfterSeconds,
} from "./predictions";

describe("buildPredictionMarketDetailFromSnapshot", () => {
  it("maps DB snapshot prices into the mobile market detail shape", () => {
    const detail = buildPredictionMarketDetailFromSnapshot({
      id: "POLY-123",
      question: "Will Midnight ship this week?",
      outcomePrices: { Yes: 0.73, No: 0.27 },
      volume: 12500,
      endDate: new Date("2026-04-25T12:00:00Z"),
      closed: false,
      result: null,
    });

    expect(detail).toMatchObject({
      marketId: "POLY-123",
      status: "open",
      result: null,
      metadata: { title: "Will Midnight ship this week?" },
      pricing: {
        buyYesPriceUsd: 730000,
        buyNoPriceUsd: 270000,
        sellYesPriceUsd: 730000,
        sellNoPriceUsd: 270000,
        volume: 12500,
      },
    });
    expect(detail.closeTime).toBe(1777118400);
  });

  it("marks closed snapshots as closed even without rules metadata", () => {
    const detail = buildPredictionMarketDetailFromSnapshot({
      id: "POLY-456",
      question: "Resolved market",
      outcomePrices: { Yes: 1, No: 0 },
      volume: 9000,
      endDate: null,
      closed: true,
      result: "yes",
    });

    expect(detail.status).toBe("closed");
    expect(detail.result).toBe("yes");
    expect(detail.closeTime).toBe(0);
  });
});

describe("getJupiterRetryAfterSeconds", () => {
  it("prefers Retry-After seconds when present", () => {
    const headers = new Headers({ "retry-after": "7", "x-ratelimit-reset": "9999999999" });
    expect(getJupiterRetryAfterSeconds(headers, 0)).toBe(7);
  });

  it("derives retry delay from x-ratelimit-reset epoch seconds", () => {
    const headers = new Headers({ "x-ratelimit-reset": "1776793652" });
    expect(getJupiterRetryAfterSeconds(headers, Date.parse("2026-04-21T17:47:25Z"))).toBe(7);
  });
});

describe("getPredictionMinimumTradeUsd", () => {
  it("defaults to $1 when the env var is absent", () => {
    expect(getPredictionMinimumTradeUsd({})).toBe(1);
  });

  it("reads a higher environment-configured minimum", () => {
    expect(getPredictionMinimumTradeUsd({ PREDICTION_MIN_TRADE_USD: "5" })).toBe(5);
  });

  it("ignores invalid environment values", () => {
    expect(getPredictionMinimumTradeUsd({ PREDICTION_MIN_TRADE_USD: "0" })).toBe(1);
    expect(getPredictionMinimumTradeUsd({ PREDICTION_MIN_TRADE_USD: "abc" })).toBe(1);
  });
});
