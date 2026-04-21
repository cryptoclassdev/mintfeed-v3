import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateTradeAmount,
  parseTradeAmount,
  isBinaryMarket,
  formatResolutionCountdown,
  formatCompactVolume,
  formatCompactDate,
  computeLiquiditySpread,
} from "./trade-validation";

describe("validateTradeAmount", () => {
  it("returns valid for amounts > $1", () => {
    expect(validateTradeAmount("5.00")).toEqual({ valid: true });
    expect(validateTradeAmount("1.01")).toEqual({ valid: true });
    expect(validateTradeAmount("1000000")).toEqual({ valid: true });
  });

  it("returns BELOW_MINIMUM for amounts <= $1", () => {
    expect(validateTradeAmount("1")).toEqual({ valid: false, error: "BELOW_MINIMUM" });
    expect(validateTradeAmount("1.00")).toEqual({ valid: false, error: "BELOW_MINIMUM" });
    expect(validateTradeAmount("0.99")).toEqual({ valid: false, error: "BELOW_MINIMUM" });
    expect(validateTradeAmount("0.50")).toEqual({ valid: false, error: "BELOW_MINIMUM" });
    expect(validateTradeAmount("0")).toEqual({ valid: false, error: "BELOW_MINIMUM" });
  });

  it("supports a caller-provided market minimum", () => {
    expect(validateTradeAmount("5.00", 5)).toEqual({ valid: false, error: "BELOW_MINIMUM" });
    expect(validateTradeAmount("5.01", 5)).toEqual({ valid: true });
  });

  it("returns INVALID_NUMBER for non-numeric input", () => {
    expect(validateTradeAmount("")).toEqual({ valid: false, error: "INVALID_NUMBER" });
    expect(validateTradeAmount("abc")).toEqual({ valid: false, error: "INVALID_NUMBER" });
    expect(validateTradeAmount("1.2.3")).toEqual({ valid: false, error: "INVALID_NUMBER" });
  });

  it("returns INVALID_NUMBER for negative amounts", () => {
    expect(validateTradeAmount("-5")).toEqual({ valid: false, error: "INVALID_NUMBER" });
  });
});

describe("parseTradeAmount", () => {
  it("returns number for valid strings", () => {
    expect(parseTradeAmount("5")).toBe(5);
    expect(parseTradeAmount("1.50")).toBe(1.5);
    expect(parseTradeAmount("0")).toBe(0);
  });

  it("returns null for invalid strings", () => {
    expect(parseTradeAmount("")).toBeNull();
    expect(parseTradeAmount("abc")).toBeNull();
    expect(parseTradeAmount("1.2.3")).toBeNull();
  });
});

describe("isBinaryMarket", () => {
  it("returns true for [Yes, No] arrays", () => {
    expect(isBinaryMarket(["Yes", "No"])).toBe(true);
    expect(isBinaryMarket(["yes", "no"])).toBe(true);
    expect(isBinaryMarket(["YES", "NO"])).toBe(true);
    expect(isBinaryMarket(["No", "Yes"])).toBe(true);
  });

  it("returns false for non-binary arrays", () => {
    expect(isBinaryMarket(["Yes", "No", "Maybe"])).toBe(false);
    expect(isBinaryMarket([])).toBe(false);
    expect(isBinaryMarket(["Yes"])).toBe(false);
    expect(isBinaryMarket(null)).toBe(false);
    expect(isBinaryMarket(undefined)).toBe(false);
    expect(isBinaryMarket("Yes")).toBe(false);
  });

  it("returns false for multi-outcome markets", () => {
    expect(isBinaryMarket(["Trump", "Biden", "DeSantis"])).toBe(false);
    expect(isBinaryMarket(["Option A", "Option B"])).toBe(false);
  });
});

describe("filterBinaryMarkets", () => {
  it("keeps only markets with Yes/No outcomes", () => {
    const markets = [
      { id: "1", outcomes: ["Yes", "No"], question: "Binary?" },
      { id: "2", outcomes: ["Trump", "Biden", "DeSantis"], question: "Who wins?" },
      { id: "3", outcomes: ["Yes", "No"], question: "Another binary?" },
    ];
    const filtered = markets.filter((m) => isBinaryMarket(m.outcomes));
    expect(filtered).toHaveLength(2);
    expect(filtered.map((m) => m.id)).toEqual(["1", "3"]);
  });

  it("returns empty array when no binary markets exist", () => {
    const markets = [
      { id: "1", outcomes: ["A", "B", "C"], question: "Multi?" },
      { id: "2", outcomes: null, question: "Null outcomes?" },
    ];
    const filtered = markets.filter((m) => isBinaryMarket(m.outcomes));
    expect(filtered).toHaveLength(0);
  });

  it("handles outcomePrices-only check as fallback", () => {
    const prices = { Yes: 0.73, No: 0.27 };
    const nonBinaryPrices = { Trump: 0.5, Biden: 0.3, DeSantis: 0.2 };
    const hasYesNo = (op: Record<string, number>) => "Yes" in op && "No" in op && Object.keys(op).length === 2;
    expect(hasYesNo(prices)).toBe(true);
    expect(hasYesNo(nonBinaryPrices)).toBe(false);
  });
});

describe("formatResolutionCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns days countdown", () => {
    const threeDaysFromNow = Math.floor(Date.now() / 1000) + 3 * 86400;
    expect(formatResolutionCountdown(threeDaysFromNow)).toBe("Resolves in 3 days");
  });

  it("returns singular day", () => {
    const oneDayFromNow = Math.floor(Date.now() / 1000) + 86400;
    expect(formatResolutionCountdown(oneDayFromNow)).toBe("Resolves in 1 day");
  });

  it("returns hours countdown", () => {
    const fiveHoursFromNow = Math.floor(Date.now() / 1000) + 5 * 3600;
    expect(formatResolutionCountdown(fiveHoursFromNow)).toBe("Resolves in 5 hours");
  });

  it("returns minutes countdown", () => {
    const thirtyMinFromNow = Math.floor(Date.now() / 1000) + 30 * 60;
    expect(formatResolutionCountdown(thirtyMinFromNow)).toBe("Resolves in 30 min");
  });

  it("returns Resolves today for very short time", () => {
    const secondsFromNow = Math.floor(Date.now() / 1000) + 30;
    expect(formatResolutionCountdown(secondsFromNow)).toBe("Resolves today");
  });

  it("returns Resolved for past times", () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600;
    expect(formatResolutionCountdown(pastTime)).toBe("Resolved");
  });
});

describe("formatCompactVolume", () => {
  it("formats millions", () => expect(formatCompactVolume(362_000_000)).toBe("$362M"));
  it("formats thousands", () => expect(formatCompactVolume(50_000)).toBe("$50K"));
  it("formats small amounts", () => expect(formatCompactVolume(50)).toBe("$50"));
  it("returns null for zero", () => expect(formatCompactVolume(0)).toBeNull());
  it("formats real Jupiter volume", () => expect(formatCompactVolume(1_610_832)).toBe("$1.6M"));
});

describe("formatCompactDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-08T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats same-year date without year", () => expect(formatCompactDate("2026-12-31T00:00:00Z")).toBe("Dec 31"));
  it("formats different-year date with year", () => expect(formatCompactDate("2027-06-15T00:00:00Z")).toBe("Jun 15, 2027"));
  it("returns null for null input", () => expect(formatCompactDate(null)).toBeNull());
});

describe("computeLiquiditySpread", () => {
  it("computes spread as buy minus sell", () => expect(computeLiquiditySpread({ buyYesPriceUsd: 86_000, sellYesPriceUsd: 85_000 })).toBeCloseTo(0.001));
  it("returns 0 for zero prices", () => expect(computeLiquiditySpread({ buyYesPriceUsd: 0, sellYesPriceUsd: 0 })).toBe(0));
});
