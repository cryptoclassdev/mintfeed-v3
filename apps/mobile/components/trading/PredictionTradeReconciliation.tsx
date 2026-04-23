import { useEffect, useMemo } from "react";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useAppStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import { usePredictionOrders } from "@/hooks/usePredictionOrders";
import { usePredictionPositions } from "@/hooks/usePredictionPositions";
import {
  getPendingPredictionTradeSuccessCopy,
  shouldResolvePendingPredictionTrade,
} from "@/lib/prediction-trade-reconciliation";

const RECONCILIATION_REFETCH_INTERVAL_MS = 5_000;
const RECONCILIATION_STALE_TIME_MS = 0;

export function PredictionTradeReconciliation() {
  const { account } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;
  const pendingTradesMap = useAppStore((state) => state.pendingPredictionTrades);
  const removePendingPredictionTrade = useAppStore(
    (state) => state.removePendingPredictionTrade,
  );
  const prunePendingPredictionTrades = useAppStore(
    (state) => state.prunePendingPredictionTrades,
  );

  const pendingTrades = useMemo(
    () =>
      Object.values(pendingTradesMap).filter(
        (trade) => trade.walletAddress === walletAddress,
      ),
    [pendingTradesMap, walletAddress],
  );

  const shouldPoll = !!walletAddress && pendingTrades.length > 0;

  const ordersQuery = usePredictionOrders(walletAddress ?? undefined, {
    enabled: shouldPoll,
    fresh: true,
    refetchInterval: RECONCILIATION_REFETCH_INTERVAL_MS,
    staleTime: RECONCILIATION_STALE_TIME_MS,
  });
  const positionsQuery = usePredictionPositions(walletAddress ?? undefined, {
    enabled: shouldPoll,
    fresh: true,
    refetchInterval: RECONCILIATION_REFETCH_INTERVAL_MS,
    staleTime: RECONCILIATION_STALE_TIME_MS,
  });

  useEffect(() => {
    prunePendingPredictionTrades();
  }, [prunePendingPredictionTrades]);

  useEffect(() => {
    if (!shouldPoll) return;

    for (const trade of pendingTrades) {
      if (
        !shouldResolvePendingPredictionTrade(
          trade,
          ordersQuery.data,
          positionsQuery.data,
        )
      ) {
        continue;
      }

      removePendingPredictionTrade(trade.id);

      if (trade.verification === "uncertain") {
        const copy = getPendingPredictionTradeSuccessCopy(trade);
        showToast("success", copy.title, copy.message, 4000);
      }
    }
  }, [
    shouldPoll,
    pendingTrades,
    ordersQuery.data,
    positionsQuery.data,
    removePendingPredictionTrade,
  ]);

  return null;
}
