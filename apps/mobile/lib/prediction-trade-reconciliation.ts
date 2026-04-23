import type { JupiterPaginatedResponse, PredictionOrder, PredictionPosition } from "@midnight/shared";
import type { PendingPredictionTrade } from "@/lib/store";

function getContracts(value: string | number | undefined | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function findMatchingPosition(
  trade: PendingPredictionTrade,
  positions: PredictionPosition[],
): PredictionPosition | undefined {
  if (trade.positionPubkey) {
    return positions.find((position) => position.pubkey === trade.positionPubkey);
  }

  return positions.find(
    (position) =>
      position.marketId === trade.marketId &&
      position.isYes === trade.isYes,
  );
}

function hasMatchingOrder(
  trade: PendingPredictionTrade,
  orders: PredictionOrder[],
): boolean {
  if (trade.externalOrderId) {
    return orders.some((order) => order.externalOrderId === trade.externalOrderId);
  }

  return orders.some(
    (order) =>
      order.marketId === trade.marketId &&
      order.isYes === trade.isYes &&
      ((trade.kind === "buy" && order.isBuy) ||
        (trade.kind === "close" && !order.isBuy)),
  );
}

export function shouldResolvePendingPredictionTrade(
  trade: PendingPredictionTrade,
  ordersResponse: JupiterPaginatedResponse<PredictionOrder> | undefined,
  positionsResponse: JupiterPaginatedResponse<PredictionPosition> | undefined,
): boolean {
  const orders = ordersResponse?.data ?? [];
  const positions = positionsResponse?.data ?? [];

  if (hasMatchingOrder(trade, orders)) {
    return true;
  }

  const matchingPosition = findMatchingPosition(trade, positions);
  const baselineContracts = trade.baselineContracts ?? 0;

  switch (trade.kind) {
    case "buy":
      return !!matchingPosition && getContracts(matchingPosition.contracts) > baselineContracts;
    case "close":
      return !matchingPosition || getContracts(matchingPosition.contracts) < baselineContracts;
    case "claim":
      return !matchingPosition || matchingPosition.claimed || matchingPosition.claimable === false;
    default:
      return false;
  }
}

export function getPendingPredictionTradeSuccessCopy(trade: PendingPredictionTrade): {
  title: string;
  message: string;
} {
  switch (trade.kind) {
    case "buy":
      return {
        title: "Bet Submitted",
        message: "Your trade landed and your positions are updating.",
      };
    case "close":
      return {
        title: "Close Submitted",
        message: "Your close order landed and your positions are updating.",
      };
    case "claim":
      return {
        title: "Claim Submitted",
        message: "Your claim landed and your wallet state is updating.",
      };
    default:
      return {
        title: "Transaction Submitted",
        message: "Your transaction landed and the app is catching up.",
      };
  }
}
