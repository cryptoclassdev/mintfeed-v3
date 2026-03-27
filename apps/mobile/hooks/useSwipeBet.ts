import { useCallback, useRef } from "react";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useAppStore, QUICK_BET_MIN } from "@/lib/store";
import { useCreateOrder } from "@/hooks/usePredictionTrading";
import { usdToMicro, USDC_MINT } from "@mintfeed/shared";
import { showToast } from "@/lib/toast";
import * as haptics from "@/lib/haptics";

const UNDO_WINDOW_MS = 3000;

interface PendingBet {
  marketId: string;
  side: "yes" | "no";
  amount: number;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Hook that manages swipe-to-bet with a 3-second undo window.
 *
 * Flow:
 * 1. User swipes → shows confirmation toast with undo button
 * 2. After 3 seconds, the bet is submitted
 * 3. If user taps undo, the bet is cancelled
 */
export function useSwipeBet() {
  const { account } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;
  const createOrder = useCreateOrder();
  const quickBetAmount = useAppStore((s) => s.quickBetAmount);
  const pendingRef = useRef<PendingBet | null>(null);

  const executeBet = useCallback(
    async (marketId: string, side: "yes" | "no", amount: number) => {
      if (!walletAddress) return;

      // Validate minimum bet amount
      if (amount < QUICK_BET_MIN) {
        showToast("error", "Bet Too Small", `Minimum bet is $${QUICK_BET_MIN}`);
        return;
      }

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
        showToast(
          "success",
          "Bet Placed",
          `$${amount} on ${side.toUpperCase()} submitted.`,
        );
      } catch (err: unknown) {
        haptics.error();
        const message = err instanceof Error ? err.message : String(err);
        showToast("error", "Trade Failed", message);
      }
    },
    [walletAddress, createOrder],
  );

  const cancelPending = useCallback(() => {
    if (pendingRef.current) {
      clearTimeout(pendingRef.current.timer);
      pendingRef.current = null;
      haptics.lightImpact();
      showToast("info", "Bet Cancelled", "Quick bet was undone.");
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

      // Set up deferred execution
      const timer = setTimeout(() => {
        pendingRef.current = null;
        executeBet(marketId, side, amount);
      }, UNDO_WINDOW_MS);

      pendingRef.current = { marketId, side, amount, timer };

      // Show confirmation toast with undo callback
      showToast(
        "info",
        `${side.toUpperCase()} $${amount}`,
        "Placing bet in 3s… Tap to undo.",
        UNDO_WINDOW_MS,
        cancelPending,
      );
    },
    [walletAddress, quickBetAmount, executeBet],
  );

  return {
    swipeBet,
    cancelPending,
    walletConnected: !!walletAddress,
    isPending: createOrder.isPending,
  };
}
