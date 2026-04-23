import { useQuery } from "@tanstack/react-query";
import { fetchMarket, fetchOrderbook } from "@/lib/prediction-client";
import type { PredictionMarketDetail, OrderbookData } from "@midnight/shared";

const MARKET_REFETCH_INTERVAL_MS = 15_000;
const MARKET_STALE_TIME_MS = 10_000;
const ORDERBOOK_REFETCH_INTERVAL_MS = 10_000;
const ORDERBOOK_STALE_TIME_MS = 5_000;

export function usePredictionMarketDetail(
  marketId: string | undefined,
  options?: { initialData?: PredictionMarketDetail; fresh?: boolean },
) {
  return useQuery<PredictionMarketDetail>({
    queryKey: ["prediction-market", marketId, options?.fresh ? "fresh" : "cached"],
    queryFn: () => fetchMarket(marketId!, { fresh: options?.fresh }),
    enabled: !!marketId,
    refetchInterval: MARKET_REFETCH_INTERVAL_MS,
    staleTime: MARKET_STALE_TIME_MS,
    refetchOnMount: false,
    placeholderData: (prev) => prev ?? options?.initialData,
  });
}

export function usePredictionOrderbook(marketId: string | undefined) {
  return useQuery<OrderbookData>({
    queryKey: ["prediction-orderbook", marketId],
    queryFn: () => fetchOrderbook(marketId!),
    enabled: !!marketId,
    refetchInterval: ORDERBOOK_REFETCH_INTERVAL_MS,
    staleTime: ORDERBOOK_STALE_TIME_MS,
    refetchOnMount: false,
  });
}
