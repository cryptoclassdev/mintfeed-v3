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
  publishedAt: string;
  createdAt: string;
  predictionMarket: PredictionMarket | null;
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
