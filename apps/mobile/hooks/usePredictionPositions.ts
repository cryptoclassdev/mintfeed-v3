import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "@/lib/prediction-client";
import type { JupiterPaginatedResponse, PredictionPosition } from "@midnight/shared";

const POSITIONS_REFETCH_INTERVAL_MS = 30_000;
const POSITIONS_STALE_TIME_MS = 30_000;

interface UsePredictionPositionsOptions {
  enabled?: boolean;
  fresh?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export function usePredictionPositions(
  ownerPubkey: string | undefined,
  options?: UsePredictionPositionsOptions,
) {
  return useQuery<JupiterPaginatedResponse<PredictionPosition>>({
    queryKey: ["prediction-positions", ownerPubkey, options?.fresh ? "fresh" : "cached"],
    queryFn: () => fetchPositions(ownerPubkey!, { fresh: options?.fresh }),
    enabled: options?.enabled ?? !!ownerPubkey,
    refetchInterval: options?.refetchInterval ?? POSITIONS_REFETCH_INTERVAL_MS,
    staleTime: options?.staleTime ?? POSITIONS_STALE_TIME_MS,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });
}
