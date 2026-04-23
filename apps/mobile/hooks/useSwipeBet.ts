import { useCallback, useEffect, useRef } from "react";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useAppStore, QUICK_BET_MIN } from "@/lib/store";
import { useCreateOrder, useTradingStatus } from "@/hooks/usePredictionTrading";
import { getMinimumTradeUsdFromError } from "@/lib/prediction-errors";
import { fetchMarket } from "@/lib/prediction-client";
import { microToUsd, usdToMicro, USDC_MINT } from "@midnight/shared";
import { showToast, updateToast } from "@/lib/toast";
import * as haptics from "@/lib/haptics";

const UNDO_WINDOW_MS = 3000;
const SWIPE_QUOTE_DRIFT_ABORT_USD = 0.03;

interface PendingBet {
  marketId: string;
  side: "yes" | "no";
  amount: number;
  indicativePriceUsd: number | null;
  timer: ReturnType<typeof setTimeout>;
  toastId: string;
}

export function getFreshSwipePriceUsd(
  pricing: {
    buyYesPriceUsd: number;
    buyNoPriceUsd: number;
  },
  side: "yes" | "no",
): number {
  return microToUsd(
    side === "yes" ? pricing.buyYesPriceUsd : pricing.buyNoPriceUsd,
  );
}

export function formatSwipePrice(priceUsd: number): string {
  return `${Math.round(priceUsd * 100)}\u00A2`;
}

export function shouldAbortForQuoteDrift(
  indicativePriceUsd: number | null,
  freshPriceUsd: number,
): boolean {
  if (indicativePriceUsd == null || indicativePriceUsd <= 0) return false;
  return Math.abs(freshPriceUsd - indicativePriceUsd) >= SWIPE_QUOTE_DRIFT_ABORT_USD;
}

/**
 * Hook that manages swipe-to-bet with a 3-second undo window.
 *
 * Flow:
 * 1. User swipes -> shows toast with undo countdown
 * 2. After 3 seconds, toast updates to "Signing..." then "Bet Placed" or error
 * 3. If user taps undo, the bet is cancelled
 */
export function useSwipeBet() {
  const { account } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;
  const createOrder = useCreateOrder();
  const { data: tradingStatus } = useTradingStatus();
  const quickBetAmount = useAppStore((s) => s.quickBetAmount);
  const pendingRef = useRef<PendingBet | null>(null);
  const minimumQuickBetUsd = Math.max(
    QUICK_BET_MIN,
    tradingStatus?.minimum_order_usd ?? QUICK_BET_MIN,
  );

  const executeBet = useCallback(
    async (
      marketId: string,
      side: "yes" | "no",
      amount: number,
      indicativePriceUsd: number | null,
      toastId: string,
    ) => {
      if (!walletAddress) {
        updateToast(toastId, {
          variant: "error",
          title: "Wallet Disconnected",
          message: "Reconnect your wallet to place bets.",
          duration: 3000,
          onTap: null,
        });
        return;
      }

      if (amount < minimumQuickBetUsd) {
        updateToast(toastId, {
          variant: "error",
          title: "Bet Too Small",
          message: `Minimum bet is $${minimumQuickBetUsd}`,
          duration: 3000,
          onTap: null,
          shake: true,
        });
        return;
      }

      let freshPriceUsd: number;
      try {
        const market = await fetchMarket(marketId, { fresh: true });
        freshPriceUsd = getFreshSwipePriceUsd(market.pricing, side);
      } catch (error) {
        updateToast(toastId, {
          variant: "error",
          title: "Price Refresh Failed",
          message: "Couldn't refresh the latest quote. Open the market sheet or try the swipe again.",
          duration: 4500,
          onTap: null,
          shake: true,
        });
        return;
      }

      if (shouldAbortForQuoteDrift(indicativePriceUsd, freshPriceUsd)) {
        updateToast(toastId, {
          variant: "info",
          title: "Price Updated",
          message:
            indicativePriceUsd == null
              ? `Latest ${side.toUpperCase()} price is ${formatSwipePrice(freshPriceUsd)}. Swipe again to bet at this quote.`
              : `${side.toUpperCase()} moved from ${formatSwipePrice(indicativePriceUsd)} to ${formatSwipePrice(freshPriceUsd)}. Swipe again to bet at the latest quote.`,
          duration: 5000,
          onTap: null,
          shake: true,
        });
        return;
      }

      updateToast(toastId, {
        variant: "info",
        title: "Signing...",
        message: `$${amount} on ${side.toUpperCase()} at ~${formatSwipePrice(freshPriceUsd)}`,
        duration: 0,
        onTap: null,
      });

      try {
        const result = await createOrder.mutateAsync({
          ownerPubkey: walletAddress,
          marketId,
          isYes: side === "yes",
          isBuy: true,
          depositAmount: usdToMicro(amount),
          depositMint: USDC_MINT,
        });

        if (result.verification === "uncertain") {
          haptics.lightImpact();
          updateToast(toastId, {
            variant: "info",
            title: "Checking Trade Status",
            message: `$${amount} on ${side.toUpperCase()} may have landed. Refreshing positions…`,
            duration: 5000,
          });
        } else if (result.status === "pending") {
          haptics.lightImpact();
          updateToast(toastId, {
            variant: "info",
            title: "Transaction Pending",
            message: `$${amount} on ${side.toUpperCase()} sent. Confirming\u2026`,
            duration: 5000,
          });
        } else {
          haptics.success();
          updateToast(toastId, {
            variant: "success",
            title: "Bet Placed",
            message: `$${amount} on ${side.toUpperCase()} confirmed.`,
            duration: 2500,
          });
        }
      } catch (err: unknown) {
        haptics.error();
        const minimumTradeUsd = getMinimumTradeUsdFromError(err);
        const message = minimumTradeUsd
          ? `Minimum bet for this market is >$${minimumTradeUsd.toFixed(2)}.`
          : err instanceof Error
            ? err.message
            : String(err);
        const retryable = err instanceof Error && (err as any).retryable === true;
        updateToast(toastId, {
          variant: "error",
          title: "Trade Failed",
          message: retryable ? `${message} Tap to retry.` : message,
          duration: retryable ? 6000 : 4000,
          shake: true,
          onTap: retryable
            ? () => { executeBet(marketId, side, amount, indicativePriceUsd, toastId); }
            : undefined,
        });
      }
    },
    [walletAddress, createOrder, minimumQuickBetUsd],
  );

  const cancelPending = useCallback(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      const { toastId } = pendingRef.current;
      pendingRef.current = null;
      haptics.lightImpact();
      updateToast(toastId, {
        variant: "info",
        title: "Bet Cancelled",
        message: "Quick bet was undone.",
        duration: 1500,
        onTap: null,
      });
    }
  }, []);

  // Clean up pending bet timer and toast on unmount
  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        const { toastId } = pendingRef.current;
        pendingRef.current = null;
        updateToast(toastId, {
          variant: "info",
          title: "Bet Cancelled",
          message: "Navigation interrupted the bet.",
          duration: 2000,
          onTap: null,
        });
      }
    };
  }, []);

  const swipeBet = useCallback(
    (marketId: string, side: "yes" | "no", indicativePriceUsd: number | null = null) => {
      if (!walletAddress) {
        haptics.warning();
        showToast(
          "error",
          "Wallet Required",
          "Connect your wallet to place bets.",
        );
        return;
      }

      // Cancel any existing pending bet
      if (pendingRef.current) {
        clearTimeout(pendingRef.current.timer);
        pendingRef.current = null;
      }

      const amount = quickBetAmount;

      haptics.heavyImpact();

      // Show undo toast — duration 0 (no auto-dismiss) so the toast stays
      // alive for executeBet to update. It will be dismissed or updated by
      // executeBet/cancelPending after the countdown.
      const toastId = showToast(
        "info",
        `${side.toUpperCase()} $${amount}`,
        "Placing bet in 3s\u2026 Tap to undo.",
        0,
        cancelPending,
      );

      // Set up deferred execution
      const timer = setTimeout(() => {
        pendingRef.current = null;
        executeBet(marketId, side, amount, indicativePriceUsd, toastId);
      }, UNDO_WINDOW_MS);

      pendingRef.current = { marketId, side, amount, indicativePriceUsd, timer, toastId };
    },
    [walletAddress, quickBetAmount, executeBet, cancelPending],
  );

  return {
    swipeBet,
    cancelPending,
    walletConnected: !!walletAddress,
    isPending: createOrder.isPending,
  };
}
