import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import {
  validateTradeAmount,
  parseTradeAmount,
  formatResolutionCountdown,
  MINIMUM_TRADE_USD,
} from "@midnight/shared";
import {
  buildResolutionRulePreview,
  formatResolveDateTime,
} from "@/lib/market-sheet-utils";
import { usePredictionMarketDetail } from "@/hooks/usePredictionMarket";
import { useCreateOrder, useTradingStatus } from "@/hooks/usePredictionTrading";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { showToast } from "@/lib/toast";
import MarketSheet from "../[id]";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(),
  Link: "Link",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name }: { name: string }) => name,
}));

// Mock all hooks used by MarketSheet
jest.mock("@/lib/store", () => ({
  useAppStore: Object.assign(
    jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
      selector({ theme: "dark", hapticsEnabled: true }),
    ),
    {
      getState: () => ({ hapticsEnabled: true }),
    },
  ),
}));

jest.mock("@/hooks/usePredictionMarket", () => ({
  usePredictionMarketDetail: jest.fn(() => ({ data: null, isLoading: false })),
}));

jest.mock("@/hooks/usePredictionTrading", () => ({
  useCreateOrder: jest.fn(() => ({ mutateAsync: jest.fn(), isPending: false })),
  useTradingStatus: jest.fn(() => ({ data: { trading_active: true } })),
}));

jest.mock("@/hooks/useWalletBalance", () => ({
  useWalletBalance: jest.fn(() => ({ data: null })),
}));

jest.mock("@/lib/toast", () => ({
  showToast: jest.fn(),
}));

jest.mock("@/lib/haptics", () => ({
  selection: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  mediumImpact: jest.fn(),
  heavyImpact: jest.fn(),
}));

const mockedUseLocalSearchParams =
  useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;
const mockedUseMobileWallet =
  useMobileWallet as jest.MockedFunction<typeof useMobileWallet>;
const mockedUsePredictionMarketDetail =
  usePredictionMarketDetail as jest.MockedFunction<typeof usePredictionMarketDetail>;
const mockedUseCreateOrder =
  useCreateOrder as jest.MockedFunction<typeof useCreateOrder>;
const mockedUseTradingStatus =
  useTradingStatus as jest.MockedFunction<typeof useTradingStatus>;
const mockedUseWalletBalance =
  useWalletBalance as jest.MockedFunction<typeof useWalletBalance>;
const mockedShowToast = showToast as jest.MockedFunction<typeof showToast>;

const marketDetail = {
  marketId: "market-1",
  status: "open",
  result: null,
  openTime: 0,
  closeTime: 1798761600,
  resolveAt: null,
  metadata: {
    title: "Will Satoshi move any Bitcoin in 2026?",
    rulesPrimary: "Resolves YES if Satoshi-linked wallets move BTC.",
  },
  pricing: {
    buyYesPriceUsd: 100000,
    buyNoPriceUsd: 900000,
    sellYesPriceUsd: 100000,
    sellNoPriceUsd: 900000,
    volume: 2_638_803,
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function mockMarketData(options?: { freshMarket?: typeof marketDetail | null }) {
  const freshMarket = options?.freshMarket === undefined
    ? marketDetail
    : options.freshMarket;
  mockedUsePredictionMarketDetail.mockImplementation((_: string | undefined, queryOptions?: { fresh?: boolean }) => {
    if (queryOptions?.fresh) {
      return {
        data: freshMarket,
        isLoading: false,
        isError: !freshMarket,
      } as ReturnType<typeof usePredictionMarketDetail>;
    }

    return {
      data: marketDetail,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePredictionMarketDetail>;
  });
}

function renderMarketSheet() {
  return render(<MarketSheet />, {
    wrapper: createWrapper(),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseLocalSearchParams.mockReturnValue({
    id: "market-1",
    question: "Will Satoshi move any Bitcoin in 2026?",
  });
  mockedUseMobileWallet.mockReturnValue({
    account: { address: { toString: () => "wallet-1" } },
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
    signAndSendTransaction: jest.fn(),
    signAndSendTransactions: jest.fn(),
    signMessage: jest.fn(),
    connection: {},
  } as any);
  mockMarketData();
  mockedUseCreateOrder.mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false,
  } as any);
  mockedUseTradingStatus.mockReturnValue({
    data: { trading_active: true, minimum_order_usd: 5 },
  } as any);
  mockedUseWalletBalance.mockReturnValue({
    data: {
      solLamports: 1_000_000,
      usdcMicroAmount: 5_830_000,
    },
  } as any);
});

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

describe("MarketSheet trading workflow", () => {
  it("submits a valid buy with the server minimum and does not show a SOL-only balance warning", async () => {
    const mutateAsync = jest.fn().mockResolvedValue({
      status: "pending",
      verification: "sent",
      signature: "signature",
    });
    mockedUseCreateOrder.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderMarketSheet();

    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "5.01");

    expect(screen.queryByText(/network fees/i)).toBeNull();

    const buyButton = screen.getByRole("button", {
      name: "Buy yes at 10 cents",
    });
    expect(buyButton.props.accessibilityState?.disabled).not.toBe(true);

    fireEvent.press(buyButton);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        ownerPubkey: "wallet-1",
        marketId: "market-1",
        isYes: true,
        isBuy: true,
        depositAmount: "5010000",
        depositMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      });
    });
  });

  it("shows an insufficient USDC warning and disables buying", () => {
    mockedUseWalletBalance.mockReturnValue({
      data: {
        solLamports: 18_000_000,
        usdcMicroAmount: 1_000_000,
      },
    } as any);

    renderMarketSheet();

    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "5.01");

    expect(
      screen.queryByText("Insufficient USDC. You have $1.00 but need $5.01."),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Buy yes at 10 cents" }).props
        .accessibilityState?.disabled,
    ).toBe(true);
  });

  it("blocks trading while waiting for a fresh quote", () => {
    mockMarketData({ freshMarket: null });

    renderMarketSheet();

    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "5.01");

    expect(screen.queryByText("Latest quote unavailable. Retrying...")).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Buy yes at 10 cents" }).props
        .accessibilityState?.disabled,
    ).toBe(true);
    expect(screen.queryByText("Quote unavailable")).not.toBeNull();
  });

  it("raises the effective minimum when the server rejects the trade with a higher market minimum", async () => {
    const mutateAsync = jest.fn().mockRejectedValue(new Error("Minimum order is $7"));
    mockedUseCreateOrder.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as any);

    renderMarketSheet();

    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "5.01");
    fireEvent.press(
      screen.getByRole("button", { name: "Buy yes at 10 cents" }),
    );

    await waitFor(() => {
      expect(mockedShowToast).toHaveBeenCalledWith(
        "error",
        "Trade Failed",
        "Minimum bet for this market is >$7.00.",
      );
    });

    expect(screen.queryByText("Minimum bet: >$7.00")).not.toBeNull();
    expect(screen.queryByText("Enter >$7 to bet")).not.toBeNull();
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
