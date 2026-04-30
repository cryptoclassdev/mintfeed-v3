import { HTTPError } from "ky";
import { describe, expect, it, vi } from "vitest";
import {
  buildPredictionMarketDetailFromSnapshot,
  getPredictionMinimumTradeUsd,
  getJupiterRetryAfterSeconds,
  withPredictionWriteRetry,
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

describe("withPredictionWriteRetry", () => {
  function makeHttpError(status: number, headers?: Headers): HTTPError {
    const response = new Response(JSON.stringify({ message: "boom" }), {
      status,
      statusText: status === 429 ? "Too Many Requests" : "Bad Request",
      headers,
    });
    const request = new Request("https://api.jup.ag/prediction/v1/orders", {
      method: "POST",
    });
    return new HTTPError(response, request, {});
  }

  it("retries 429 writes, pauses reads, and waits before retrying", async () => {
    const pauseBackgroundReadsForMs = vi.fn();
    const sleep = vi.fn().mockResolvedValue(undefined);
    const run = vi
      .fn()
      .mockRejectedValueOnce(
        makeHttpError(429, new Headers({ "retry-after": "2" })),
      )
      .mockResolvedValueOnce({ ok: true });

    await expect(
      withPredictionWriteRetry(run, {
        pauseBackgroundReadsForMs,
        sleep,
      }),
    ).resolves.toEqual({ ok: true });

    expect(run).toHaveBeenCalledTimes(2);
    expect(pauseBackgroundReadsForMs).toHaveBeenCalledWith(3000);
    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it("does not retry non-429 errors", async () => {
    const pauseBackgroundReadsForMs = vi.fn();
    const sleep = vi.fn().mockResolvedValue(undefined);
    const error = makeHttpError(400);
    const run = vi.fn().mockRejectedValue(error);

    await expect(
      withPredictionWriteRetry(run, {
        pauseBackgroundReadsForMs,
        sleep,
      }),
    ).rejects.toBe(error);

    expect(run).toHaveBeenCalledTimes(1);
    expect(pauseBackgroundReadsForMs).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });

  it("stops retrying after the third 429 failure", async () => {
    const pauseBackgroundReadsForMs = vi.fn();
    const sleep = vi.fn().mockResolvedValue(undefined);
    const error = makeHttpError(
      429,
      new Headers({ "x-ratelimit-reset": "1776793652" }),
    );
    const run = vi.fn().mockRejectedValue(error);

    await expect(
      withPredictionWriteRetry(run, {
        pauseBackgroundReadsForMs,
        sleep,
        getRetryAfterSeconds: () => 1,
      }),
    ).rejects.toBe(error);

    expect(run).toHaveBeenCalledTimes(3);
    expect(pauseBackgroundReadsForMs).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});
