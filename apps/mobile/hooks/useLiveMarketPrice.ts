import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const STALE_TIME = 60 * 1000; // 1 minute — live prices refresh faster
const REFETCH_INTERVAL = 30 * 1000; // Refetch every 30s while mounted

/**
 * Fetch live outcome prices for a single prediction market.
 * Only enabled when marketId is provided (i.e., the card is visible).
 */
export function useLiveMarketPrice(marketId: string | undefined) {
  return useQuery({
    queryKey: ["liveMarketPrice", marketId],
    queryFn: async () => {
      try {
        const result = await api
          .get("api/v1/predictions/live", {
            searchParams: { ids: marketId! },
          })
          .json<{ data: Record<string, Record<string, number>> }>();
        return result.data[marketId!] ?? null;
      } catch {
        // Live price fetch failed — PredictionCard will use pre-fetched prices
        return null;
      }
    },
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    enabled: !!marketId,
    retry: false,
  });
}
