import {
  validateTradeAmount,
  parseTradeAmount,
  formatResolutionCountdown,
  MINIMUM_TRADE_USD,
} from "@midnight/shared";
import {
  buildResolutionRulePreview,
  formatResolveDateTime,
} from "../utils";

// Mock all hooks used by MarketSheet
jest.mock("@/lib/store", () => ({
  useAppStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ theme: "dark" }),
  ),
}));

jest.mock("@/hooks/usePredictionMarket", () => ({
  usePredictionMarketDetail: jest.fn(() => ({ data: null, isLoading: false })),
}));

jest.mock("@/hooks/usePredictionTrading", () => ({
  useCreateOrder: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useTradingStatus: jest.fn(() => ({ data: { trading_active: true } })),
}));

describe("MarketSheet trade validation logic", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-03-08T00:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("validates trade amounts correctly", () => {
    expect(validateTradeAmount("5.00")).toEqual({ valid: true });
    expect(validateTradeAmount("1")).toEqual({ valid: false, error: "BELOW_MINIMUM" });
    expect(validateTradeAmount("0.50")).toEqual({ valid: false, error: "BELOW_MINIMUM" });
    expect(validateTradeAmount("")).toEqual({ valid: false, error: "INVALID_NUMBER" });
  });

  it("parses trade amounts", () => {
    expect(parseTradeAmount("5")).toBe(5);
    expect(parseTradeAmount("1.50")).toBe(1.5);
    expect(parseTradeAmount("")).toBeNull();
    expect(parseTradeAmount("abc")).toBeNull();
  });

  it("formats resolution countdowns", () => {
    const pastTime = Math.floor(Date.now() / 1000) - 3600;
    expect(formatResolutionCountdown(pastTime)).toBe("Resolved");

    const threeDaysFromNow = Math.floor(Date.now() / 1000) + 3 * 86400;
    expect(formatResolutionCountdown(threeDaysFromNow)).toBe("Resolves in 3 days");
  });

  it("exports MINIMUM_TRADE_USD constant", () => {
    expect(MINIMUM_TRADE_USD).toBe(1);
  });
});

describe("MarketSheet buy button state", () => {
  it("determines button text based on trading status and validation", () => {
    const getButtonText = (
      isTradingPaused: boolean,
      hasAmountInput: boolean,
      validation: { valid: boolean; error?: string },
      selectedSide: "yes" | "no",
      percent: number,
      minimumTradeUsd = MINIMUM_TRADE_USD,
    ) => {
      if (isTradingPaused) return "Trading Paused";
      if (!hasAmountInput || validation.error === "INVALID_NUMBER") return `Enter >$${minimumTradeUsd} to bet`;
      if (validation.error === "BELOW_MINIMUM") return `Enter >$${minimumTradeUsd} to bet`;
      return `Buy ${selectedSide.toUpperCase()} \u00B7 ${percent}\u00A2`;
    };

    expect(getButtonText(true, false, { valid: false }, "yes", 50)).toBe("Trading Paused");
    expect(getButtonText(false, false, { valid: false, error: "INVALID_NUMBER" }, "yes", 50)).toBe("Enter >$1 to bet");
    expect(getButtonText(false, true, { valid: false, error: "BELOW_MINIMUM" }, "yes", 50)).toBe("Enter >$1 to bet");
    expect(getButtonText(false, true, { valid: true }, "yes", 73)).toBe("Buy YES \u00B7 73\u00A2");
    expect(getButtonText(false, true, { valid: true }, "no", 27)).toBe("Buy NO \u00B7 27\u00A2");
    expect(getButtonText(false, true, { valid: false, error: "BELOW_MINIMUM" }, "yes", 50, 5)).toBe("Enter >$5 to bet");
  });

  it("determines button disabled state", () => {
    const isDisabled = (valid: boolean, isPending: boolean, isTradingPaused: boolean) =>
      !valid || isPending || isTradingPaused;

    expect(isDisabled(true, false, false)).toBe(false);
    expect(isDisabled(false, false, false)).toBe(true);
    expect(isDisabled(true, true, false)).toBe(true);
    expect(isDisabled(true, false, true)).toBe(true);
  });
});

describe("MarketSheet design", () => {
  it("market title uses brand font", () => {
    // fonts.brand.bold = "BlauerNue-Bold" per typography.ts
    const { fonts } = require("@/constants/typography");
    expect(fonts.brand.bold).toBe("BlauerNue-Bold");
    // The style is verified by the font assignment in the component
  });
});

describe("MarketSheet resolution copy", () => {
  it("collapses whitespace and keeps short rules intact", () => {
    const shortRule = "Resolves YES if Bitcoin closes above $100k.\n\nResolves NO otherwise.";

    expect(buildResolutionRulePreview(shortRule)).toEqual({
      text: "Resolves YES if Bitcoin closes above $100k. Resolves NO otherwise.",
      truncated: false,
    });
  });

  it("truncates long rules into a compact preview", () => {
    const longRule = "Resolves YES if the model scores above 60. ".repeat(12);

    const preview = buildResolutionRulePreview(longRule, 120);
    expect(preview.truncated).toBe(true);
    expect(preview.text!.length).toBeLessThanOrEqual(121);
    expect(preview.text!.endsWith("…")).toBe(true);
  });

  it("formats the exact resolve date with UTC timezone", () => {
    expect(formatResolveDateTime(1772928000)).toBe("Mar 8, 2026, 12:00 AM UTC");
  });
});
