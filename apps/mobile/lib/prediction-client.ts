import { api } from "@/lib/api-client";
import type {
  PredictionMarketDetail,
  OrderbookData,
  TradingStatus,
  CreateOrderRequest,
  CreateOrderResponse,
  ClaimPositionResponse,
  SubmitSignedTransactionRequest,
  SubmitSignedTransactionResponse,
  PredictionOrder,
  PredictionPosition,
  JupiterPaginatedResponse,
} from "@mintfeed/shared";

const BASE = "api/v1/predictions";

// --- Markets ---

export function fetchMarket(marketId: string): Promise<PredictionMarketDetail> {
  return api.get(`${BASE}/markets/${marketId}`).json();
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

export async function submitSignedTransaction(
  body: SubmitSignedTransactionRequest,
): Promise<SubmitSignedTransactionResponse> {
  try {
    return await api
      .post(`${BASE}/transactions/submit`, {
        json: body,
        timeout: 45_000,
        retry: 0,
      })
      .json();
  } catch (err) {
    // After returning from wallet app (background → foreground), the network
    // stack often isn't ready yet, causing "Network request failed". Wait
    // briefly and retry once.
    const msg = err instanceof Error ? err.message : "";
    if (/network request failed/i.test(msg)) {
      await new Promise((r) => setTimeout(r, 1500));
      return api
        .post(`${BASE}/transactions/submit`, {
          json: body,
          timeout: 45_000,
          retry: 0,
        })
        .json();
    }
    throw err;
  }
}

// --- Orders ---

export function fetchOrders(
  ownerPubkey: string,
): Promise<JupiterPaginatedResponse<PredictionOrder>> {
  return api.get(`${BASE}/orders`, { searchParams: { ownerPubkey } }).json();
}

// --- Positions ---

export function fetchPositions(
  ownerPubkey: string,
): Promise<JupiterPaginatedResponse<PredictionPosition>> {
  return api.get(`${BASE}/positions`, { searchParams: { ownerPubkey } }).json();
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
