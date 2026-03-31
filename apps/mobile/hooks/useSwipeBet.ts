import { useCallback, useRef } from "react";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useAppStore, QUICK_BET_MIN } from "@/lib/store";
import { useCreateOrder } from "@/hooks/usePredictionTrading";
import { usdToMicro, USDC_MINT } from "@mintfeed/shared";
import { showToast, updateToast } from "@/lib/toast";
import * as haptics from "@/lib/haptics";

const UNDO_WINDOW_MS = 3000;

interface PendingBet {
  marketId: string;
  side: "yes" | "no";
  amount: number;
  timer: ReturnType<typeof setTimeout>;
  toastId: string;
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
  const quickBetAmount = useAppStore((s) => s.quickBetAmount);
  const pendingRef = useRef<PendingBet | null>(null);

  const executeBet = useCallback(
    async (marketId: string, side: "yes" | "no", amount: number, toastId: string) => {
      if (!walletAddress) return;

      if (amount < QUICK_BET_MIN) {
        updateToast(toastId, {
          variant: "error",
          title: "Bet Too Small",
          message: `Minimum bet is $${QUICK_BET_MIN}`,
          duration: 3000,
          onTap: null,
        });
        return;
      }

      updateToast(toastId, {
        variant: "info",
        title: "Signing...",
        message: `$${amount} on ${side.toUpperCase()}`,
        duration: 0,
        onTap: null,
      });

      try {
        await createOrder.mutateAsync({
          ownerPubkey: walletAddress,
          marketId,
          isYes: side === "yes",
          isBuy: true,
          depositAmount: usdToMicro(amount),
          depositMint: USDC_MINT,
        });
        haptics.success();
        updateToast(toastId, {
          variant: "success",
          title: "Bet Placed",
          message: `$${amount} on ${side.toUpperCase()} submitted.`,
          duration: 2500,
        });
      } catch (err: unknown) {
        haptics.error();
        const message = err instanceof Error ? err.message : String(err);
        updateToast(toastId, {
          variant: "error",
          title: "Trade Failed",
          message,
          duration: 4000,
        });
      }
    },
    [walletAddress, createOrder],
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

  const swipeBet = useCallback(
    (marketId: string, side: "yes" | "no") => {
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

      // Show undo toast and capture its ID
      const toastId = showToast(
        "info",
        `${side.toUpperCase()} $${amount}`,
        "Placing bet in 3s\u2026 Tap to undo.",
        UNDO_WINDOW_MS,
        cancelPending,
      );

      // Set up deferred execution
      const timer = setTimeout(() => {
        pendingRef.current = null;
        executeBet(marketId, side, amount, toastId);
      }, UNDO_WINDOW_MS);

      pendingRef.current = { marketId, side, amount, timer, toastId };
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
