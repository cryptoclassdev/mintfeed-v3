import { api } from "@/lib/api-client";
import type {
  PredictionMarketDetail,
  OrderbookData,
  TradingStatus,
  CreateOrderRequest,
  CreateOrderResponse,
  ClaimPositionResponse,
  PredictionOrder,
  PredictionPosition,
  JupiterPaginatedResponse,
} from "@midnight/shared";

const BASE = "api/v1/predictions";

// --- Markets ---

export function fetchMarket(
  marketId: string,
  options?: { fresh?: boolean },
): Promise<PredictionMarketDetail> {
  return api
    .get(`${BASE}/markets/${marketId}`, {
      searchParams: options?.fresh ? { fresh: "1" } : undefined,
    })
    .json();
}

export function fetchOrderbook(marketId: string): Promise<OrderbookData> {
  return api.get(`${BASE}/orderbook/${marketId}`).json();
}

// --- Trading ---

export function fetchTradingStatus(): Promise<TradingStatus> {
  return api.get(`${BASE}/trading-status`).json();
}

export function createOrder(body: CreateOrderRequest): Promise<CreateOrderResponse> {
  return api.post(`${BASE}/orders`, { json: body }).json();
}

// --- Orders ---

export function fetchOrders(
  ownerPubkey: string,
  options?: { fresh?: boolean },
): Promise<JupiterPaginatedResponse<PredictionOrder>> {
  return api
    .get(`${BASE}/orders`, {
      searchParams: options?.fresh
        ? { ownerPubkey, fresh: "1" }
        : { ownerPubkey },
    })
    .json();
}

// --- Positions ---

export function fetchPositions(
  ownerPubkey: string,
  options?: { fresh?: boolean },
): Promise<JupiterPaginatedResponse<PredictionPosition>> {
  return api
    .get(`${BASE}/positions`, {
      searchParams: options?.fresh
        ? { ownerPubkey, fresh: "1" }
        : { ownerPubkey },
    })
    .json();
}

export function fetchPosition(positionPubkey: string): Promise<PredictionPosition> {
  return api.get(`${BASE}/positions/${positionPubkey}`).json();
}

export function closePosition(
  positionPubkey: string,
  ownerPubkey: string,
  isYes: boolean,
  contracts: string,
): Promise<CreateOrderResponse> {
  return api
    .delete(`${BASE}/positions/${positionPubkey}`, {
      json: { ownerPubkey, isYes, contracts },
    })
    .json();
}

export function closeAllPositions(ownerPubkey: string): Promise<CreateOrderResponse[]> {
  return api.delete(`${BASE}/positions`, { json: { ownerPubkey } }).json();
}

export function claimPosition(
  positionPubkey: string,
  ownerPubkey: string,
): Promise<ClaimPositionResponse> {
  return api.post(`${BASE}/positions/${positionPubkey}/claim`, { json: { ownerPubkey } }).json();
}
