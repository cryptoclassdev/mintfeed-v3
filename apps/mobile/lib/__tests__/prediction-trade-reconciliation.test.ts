import {
  getPendingPredictionTradeSuccessCopy,
  shouldResolvePendingPredictionTrade,
} from "../prediction-trade-reconciliation";
import type { PendingPredictionTrade } from "@/lib/store";
import type {
  JupiterPaginatedResponse,
  PredictionOrder,
  PredictionPosition,
} from "@midnight/shared";

function makeTrade(overrides: Partial<PendingPredictionTrade> = {}): PendingPredictionTrade {
  return {
    id: "trade-1",
    walletAddress: "wallet-1",
    kind: "buy",
    verification: "uncertain",
    createdAt: Date.now(),
    marketId: "POLY-1",
    isYes: true,
    baselineContracts: 0,
    ...overrides,
  };
}

function makeOrders(
  orders: PredictionOrder[],
): JupiterPaginatedResponse<PredictionOrder> {
  return {
    data: orders,
    pagination: { start: 0, end: orders.length, total: orders.length, hasNext: false },
  };
}

function makePositions(
  positions: PredictionPosition[],
): JupiterPaginatedResponse<PredictionPosition> {
  return {
    data: positions,
    pagination: { start: 0, end: positions.length, total: positions.length, hasNext: false },
  };
}

describe("shouldResolvePendingPredictionTrade", () => {
  it("resolves a buy when an order with the externalOrderId appears", () => {
    const trade = makeTrade({ externalOrderId: "ext-1" });
    const orders = makeOrders([
      {
        pubkey: "order-1",
        ownerPubkey: "wallet-1",
        marketId: "POLY-1",
        isYes: true,
        isBuy: true,
        contracts: "10",
        priceUsd: "130000",
        status: "pending",
        externalOrderId: "ext-1",
      },
    ]);

    expect(shouldResolvePendingPredictionTrade(trade, orders, undefined)).toBe(true);
  });

  it("resolves a buy when the matching position size increases", () => {
    const trade = makeTrade({ baselineContracts: 12 });
    const positions = makePositions([
      {
        pubkey: "pos-1",
        ownerPubkey: "wallet-1",
        marketId: "POLY-1",
        isYes: true,
        contracts: "20",
        costBasisUsd: "5000000",
        pnlUsd: "0",
        claimable: false,
        valueUsd: "4800000",
        avgPriceUsd: "130000",
        pnlUsdAfterFees: "-200000",
        pnlUsdPercent: -4,
        feesPaidUsd: "200000",
        realizedPnlUsd: null,
        payoutUsd: null,
        claimableAt: null,
        claimed: false,
        openedAt: Date.now(),
      },
    ]);

    expect(shouldResolvePendingPredictionTrade(trade, undefined, positions)).toBe(true);
  });

  it("resolves a close when the position disappears", () => {
    const trade = makeTrade({
      kind: "close",
      positionPubkey: "pos-1",
      baselineContracts: 10,
    });

    expect(shouldResolvePendingPredictionTrade(trade, undefined, makePositions([]))).toBe(true);
  });

  it("resolves a claim when the position is marked claimed", () => {
    const trade = makeTrade({
      kind: "claim",
      positionPubkey: "pos-1",
    });
    const positions = makePositions([
      {
        pubkey: "pos-1",
        ownerPubkey: "wallet-1",
        marketId: "POLY-1",
        isYes: true,
        contracts: "10",
        costBasisUsd: "5000000",
        pnlUsd: "0",
        claimable: false,
        valueUsd: "0",
        avgPriceUsd: "130000",
        pnlUsdAfterFees: "0",
        pnlUsdPercent: 0,
        feesPaidUsd: "0",
        realizedPnlUsd: null,
        payoutUsd: "7000000",
        claimableAt: null,
        claimed: true,
        openedAt: Date.now(),
      },
    ]);

    expect(shouldResolvePendingPredictionTrade(trade, undefined, positions)).toBe(true);
  });
});

describe("getPendingPredictionTradeSuccessCopy", () => {
  it("returns buy copy", () => {
    expect(getPendingPredictionTradeSuccessCopy(makeTrade())).toEqual({
      title: "Bet Submitted",
      message: "Your trade landed and your positions are updating.",
    });
  });
});
