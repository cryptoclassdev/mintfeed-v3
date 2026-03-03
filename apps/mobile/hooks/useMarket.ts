import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { MarketCoin } from "@mintfeed/shared";

export function useMarket() {
  return useQuery({
    queryKey: ["market"],
    queryFn: async () => {
      if (__DEV__) console.log("[useMarket] Fetching market data...");
      try {
        const result = await api.get("api/v1/market").json<{ data: MarketCoin[] }>();
        if (__DEV__) console.log("[useMarket] Got", result.data?.length, "coins");
        return result;
      } catch (err: any) {
        if (__DEV__) console.error("[useMarket] Fetch failed:", err.message, err.name);
        throw err;
      }
    },
    refetchInterval: 60_000,
  });
}
