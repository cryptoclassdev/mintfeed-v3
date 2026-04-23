import { useQuery } from "@tanstack/react-query";
import { fetchOrders } from "@/lib/prediction-client";
import type { JupiterPaginatedResponse, PredictionOrder } from "@midnight/shared";

const ORDERS_REFETCH_INTERVAL_MS = 30_000;
const ORDERS_STALE_TIME_MS = 30_000;

interface UsePredictionOrdersOptions {
  enabled?: boolean;
  fresh?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export function usePredictionOrders(
  ownerPubkey: string | undefined,
  options?: UsePredictionOrdersOptions,
) {
  return useQuery<JupiterPaginatedResponse<PredictionOrder>>({
    queryKey: ["prediction-orders", ownerPubkey, options?.fresh ? "fresh" : "cached"],
    queryFn: () => fetchOrders(ownerPubkey!, { fresh: options?.fresh }),
    enabled: options?.enabled ?? !!ownerPubkey,
    refetchInterval: options?.refetchInterval ?? ORDERS_REFETCH_INTERVAL_MS,
    staleTime: options?.staleTime ?? ORDERS_STALE_TIME_MS,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });
}
