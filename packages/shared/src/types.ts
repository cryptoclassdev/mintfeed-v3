export enum Category {
  CRYPTO = "CRYPTO",
  AI = "AI",
}

export interface Article {
  id: string;
  sourceUrl: string;
  sourceName: string;
  category: Category;
  title: string;
  summary: string;
  originalTitle: string;
  imageUrl: string | null;
  imageBlurhash: string | null;
  sourceType?: 'RSS' | 'TWITTER';
  tweetId?: string | null;
  publishedAt: string;
  createdAt: string;
  predictionMarkets: PredictionMarket[];
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  imageUrl: string | null;
}

export interface FeedSource {
  url: string;
  name: string;
  category: Category;
  isActive: boolean;
  lastFetchAt: string | null;
}

export interface PredictionMarket {
  id: string;           // Jupiter marketId (UUID)
  question: string;     // Event title
  outcomePrices: Record<string, number>;  // { "Yes": 0.73, "No": 0.27 }
  marketUrl: string;    // Jupiter prediction page URL
  endDate?: string | null;   // ISO 8601 datetime
  volume?: number;           // plain USD from Jupiter
  closed?: boolean;
  category?: string | null;
  result?: string | null;    // "yes" | "no" | null
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeedQueryParams {
  category?: "crypto" | "ai" | "all";
  cursor?: string;
  limit?: number;
}

// --- Jupiter Prediction Markets (Trading) ---

export const MICRO_USD = 1_000_000;
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export function microToUsd(micro: number | string | null | undefined): number {
  const n = Number(micro);
  return Number.isNaN(n) ? 0 : n / MICRO_USD;
}

export function usdToMicro(usd: number): string {
  return Math.round(usd * MICRO_USD).toString();
}

export interface JupiterPagination {
  start: number;
  end: number;
  total: number;
  hasNext: boolean;
}

export interface JupiterPaginatedResponse<T> {
  data: T[];
  pagination: JupiterPagination;
}

export interface PredictionMarketPricing {
  buyYesPriceUsd: number;
  buyNoPriceUsd: number;
  sellYesPriceUsd: number;
  sellNoPriceUsd: number;
  volume: number;
}

export interface PredictionMarketDetail {
  marketId: string;
  status: "open" | "closed" | "cancelled";
  result: string | null;
  openTime: number;
  closeTime: number;
  resolveAt: number | null;
  metadata: {
    title: string;
    rulesPrimary?: string;
  };
  pricing: PredictionMarketPricing;
}

export interface OrderbookData {
  yes: [number, number][];
  no: [number, number][];
  yes_dollars: [string, number][];
  no_dollars: [string, number][];
}

export interface CreateOrderRequest {
  ownerPubkey: string;
  marketId?: string;
  positionPubkey?: string;
  isYes: boolean;
  isBuy: boolean;
  contracts?: string;
  depositAmount?: string;
  depositMint?: string;
}

export interface CreateOrderResponse {
  transaction: string;
  txMeta: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
  externalOrderId?: string;
  order: Record<string, unknown>;
}

export interface ClaimPositionResponse {
  transaction: string;
  txMeta: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
}

export interface SubmitSignedTransactionRequest {
  signedTransaction: string;
  txMeta: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
}

export interface SubmitSignedTransactionResponse {
  signature: string;
  status: "confirmed" | "pending";
}

export interface PredictionPosition {
  pubkey: string;
  ownerPubkey: string;
  marketId: string;
  isYes: boolean;
  contracts: string;
  costBasisUsd: string;
  pnlUsd: string;
  claimable: boolean;
  // Extended fields from Jupiter API
  valueUsd: string | null;
  avgPriceUsd: string | null;
  pnlUsdAfterFees: string | null;
  pnlUsdPercent: number | null;
  feesPaidUsd: string | null;
  realizedPnlUsd: string | null;
  payoutUsd: string | null;
  claimableAt: number | null;
  claimed: boolean;
  openedAt: number | null;
  market?: {
    title: string;
    status: string;
    result: string | null;
    pricing?: PredictionMarketPricing;
  };
}

export interface PredictionOrder {
  pubkey: string;
  ownerPubkey: string;
  marketId: string;
  isYes: boolean;
  isBuy: boolean;
  contracts: string;
  priceUsd: string;
  status: string;
}

export interface TradingStatus {
  trading_active: boolean;
  minimum_order_usd?: number;
}
