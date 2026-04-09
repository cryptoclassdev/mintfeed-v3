export const API_VERSION = "v1";

export const DEFAULT_PAGE_SIZE = 20;

export const ARTICLE_SUMMARY_WORD_LIMIT = 60;

export const ARTICLE_TITLE_MAX_LENGTH = 80;

export const ARTICLE_FETCH_INTERVAL_MINUTES = 15;

export const MARKET_FETCH_INTERVAL_MINUTES = 5;

export const TOP_COINS_COUNT = 100;

export const MINIMUM_TRADE_USD = 1;

export const CATEGORIES = ["all", "crypto", "ai"] as const;

export const CategoryLabel: Record<(typeof CATEGORIES)[number], string> = {
  crypto: "Crypto",
  ai: "AI",
  all: "All",
};
