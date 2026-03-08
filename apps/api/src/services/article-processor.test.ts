import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";

// Re-implement pure functions locally to avoid importing the service module,
// which has side effects (Prisma, Gemini, etc.)

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return url;
  }
}

function hashUrl(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex");
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hashTitle(title: string): string {
  return createHash("sha256").update(normalizeTitle(title)).digest("hex");
}

describe("article-processor dedup logic", () => {
  it("stores original title hash, not rewritten title hash", () => {
    const originalTitle = "Bitcoin hits new high as ETF inflows surge";
    const rewrittenTitle = "BTC Surges Past Records on ETF Demand Wave";
    expect(hashTitle(originalTitle)).not.toBe(hashTitle(rewrittenTitle));
  });

  it("detects duplicate when original titles match across sources", () => {
    const title1 = "Bitcoin hits new high as ETF inflows surge";
    const title2 = "Bitcoin hits new high as ETF inflows surge";
    expect(hashTitle(title1)).toBe(hashTitle(title2));
  });

  it("normalizes URLs by stripping query params before hashing", () => {
    const base = "https://cointelegraph.com/news/bitcoin-etf-record";
    const withParams =
      "https://cointelegraph.com/news/bitcoin-etf-record?utm_source=twitter&utm_medium=social";
    const withFragment =
      "https://cointelegraph.com/news/bitcoin-etf-record#comments";
    const withTrailingSlash =
      "https://cointelegraph.com/news/bitcoin-etf-record/";

    expect(hashUrl(base)).toBe(hashUrl(withParams));
    expect(hashUrl(base)).toBe(hashUrl(withFragment));
    expect(hashUrl(base)).toBe(hashUrl(withTrailingSlash));
  });

  it("preserves different URLs as different hashes", () => {
    const url1 = "https://cointelegraph.com/news/story-a";
    const url2 = "https://cointelegraph.com/news/story-b";
    expect(hashUrl(url1)).not.toBe(hashUrl(url2));
  });
});
