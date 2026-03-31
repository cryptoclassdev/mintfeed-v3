import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import {
  fetchTradingStatus,
  createOrder,
  submitSignedTransaction,
  closePosition,
  closeAllPositions,
  claimPosition,
} from "@/lib/prediction-client";
import {
  isWalletError,
  isTransactionExpired,
  signPredictionTransaction,
  type TransactionMeta,
} from "@/lib/wallet";
import { fetchWalletBalances, getBalanceError } from "@/lib/balance";
import { useAppStore } from "@/lib/store";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ClaimPositionResponse,
  TradingStatus,
} from "@mintfeed/shared";
import type { VersionedTransaction } from "@solana/web3.js";

const TRADING_STATUS_REFETCH_INTERVAL_MS = 30_000;

type SignFn = (tx: VersionedTransaction) => Promise<VersionedTransaction>;

export function toWalletActionError(error: unknown): Error {
  if (isWalletError(error)) {
    return new Error(error.message);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Wallet signing failed: ${message}`);
}

export async function toRelayActionError(error: unknown): Promise<Error> {
  const httpErr = error as {
    response?: { json?: () => Promise<Record<string, string>> };
    message?: string;
  };
  const body = await httpErr?.response?.json?.().catch(() => null);
  const message =
    body?.message ??
    httpErr?.message ??
    "Transaction broadcast failed. Try again.";
  return new Error(message);
}

interface RelayResult {
  signature: string;
  status: "confirmed" | "pending";
}

async function signAndRelay(
  signFn: SignFn,
  unsignedTransaction: string,
  txMeta: TransactionMeta,
): Promise<RelayResult> {
  const signedTransaction = await signPredictionTransaction(
    signFn,
    unsignedTransaction,
    txMeta,
  );
  const result = await submitSignedTransaction({ signedTransaction, txMeta });
  return { signature: result.signature, status: result.status ?? "confirmed" };
}

export function useTradingStatus() {
  return useQuery<TradingStatus>({
    queryKey: ["prediction-trading-status"],
    queryFn: fetchTradingStatus,
    refetchInterval: TRADING_STATUS_REFETCH_INTERVAL_MS,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { account, signTransactions } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<RelayResult, Error, CreateOrderRequest>({
    mutationFn: async (request) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      if (__DEV__) console.log("[createOrder] Request:", JSON.stringify(request));

      // Pre-flight balance check for buy orders
      if (request.isBuy && request.depositAmount) {
        try {
          const balances = await fetchWalletBalances(walletAddress);
          const balanceError = getBalanceError(balances, Number(request.depositAmount));
          if (balanceError) {
            throw new Error(balanceError);
          }
        } catch (err) {
          if (err instanceof Error && err.message.startsWith("Insufficient")) {
            throw err;
          }
          // RPC failure — proceed anyway, server will catch
          if (__DEV__) console.warn("[createOrder] Balance check failed:", err);
        }
      }

      let response: CreateOrderResponse;
      try {
        response = await createOrder(request);
      } catch (err: unknown) {
        const httpErr = err as {
          response?: {
            json?: () => Promise<Record<string, string>>;
            status?: number;
          };
          message?: string;
        };
        const body = await httpErr?.response?.json?.().catch(() => null);
        if (__DEV__)
          console.warn(
            "[createOrder] API error:",
            httpErr?.response?.status,
            JSON.stringify(body),
            httpErr?.message,
          );
        const code = body?.code ?? "";
        if (code === "INSUFFICIENT_FUNDS" || code === "ANCHOR_6025") {
          throw new Error(
            "Insufficient balance. You need both USDC (for the bet) and SOL (\u22480.03 for fees/rent).",
          );
        }
        throw new Error(
          body?.error ?? body?.message ?? httpErr?.message ?? "Failed to create order",
        );
      }

      if (__DEV__)
        console.log("[createOrder] Response:", JSON.stringify({
          transaction: response.transaction
            ? `${response.transaction.slice(0, 40)}...`
            : null,
          order: response.order,
        }));

      try {
        const result = await signAndRelay(
          (tx) => signTransactions(tx),
          response.transaction,
          response.txMeta,
        );
        if (__DEV__) console.log("[createOrder] TX signature:", result.signature, "status:", result.status);
        return result;
      } catch (err: unknown) {
        if (isWalletError(err)) {
          if (__DEV__) console.warn("[createOrder] MWA sign failed:", err);
          throw toWalletActionError(err);
        }
        if (isTransactionExpired(err)) {
          const error = new Error("Transaction expired. Please try again.");
          (error as any).retryable = true;
          throw error;
        }
        if (__DEV__) console.warn("[createOrder] Relay failed:", err);
        throw await toRelayActionError(err);
      }
    },
    onSuccess: () => {
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: ["prediction-positions", walletAddress],
        });
        queryClient.invalidateQueries({
          queryKey: ["prediction-orders", walletAddress],
        });
      }
    },
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();
  const { account, signTransactions } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<
    RelayResult,
    Error,
    { positionPubkey: string; ownerPubkey: string; isYes: boolean; contracts: string }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey, isYes, contracts }) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      // SOL pre-check (closing needs fees)
      try {
        const balances = await fetchWalletBalances(walletAddress);
        if (balances.solLamports < 30_000_000) {
          throw new Error("Insufficient SOL for transaction fees. You need ~0.03 SOL.");
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("Insufficient")) throw err;
        if (__DEV__) console.warn("[closePosition] Balance check failed:", err);
      }

      let response: CreateOrderResponse;
      try {
        response = await closePosition(positionPubkey, ownerPubkey, isYes, contracts);
      } catch (err: unknown) {
        const httpErr = err as { response?: { json?: () => Promise<Record<string, string>> }; message?: string };
        const body = await httpErr?.response?.json?.().catch(() => null);
        throw new Error(body?.error ?? body?.message ?? httpErr?.message ?? "Failed to close position");
      }

      try {
        return await signAndRelay(
          (tx) => signTransactions(tx),
          response.transaction,
          response.txMeta,
        );
      } catch (error) {
        if (isWalletError(error)) {
          throw toWalletActionError(error);
        }
        if (isTransactionExpired(error)) {
          const err = new Error("Transaction expired. Please try again.");
          (err as any).retryable = true;
          throw err;
        }
        throw await toRelayActionError(error);
      }
    },
    onSuccess: () => {
      if (walletAddress) {
        queryClient.invalidateQueries({ queryKey: ["prediction-positions", walletAddress] });
        queryClient.invalidateQueries({ queryKey: ["prediction-orders", walletAddress] });
      }
    },
  });
}

export function useCloseAllPositions() {
  const queryClient = useQueryClient();
  const { account, signTransactions } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<string[], Error, { ownerPubkey: string }>({
    mutationFn: async ({ ownerPubkey }) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      const responses: CreateOrderResponse[] =
        await closeAllPositions(ownerPubkey);
      const signatures: string[] = [];
      const failures: string[] = [];

      for (const r of responses) {
        try {
          const result = await signAndRelay(
            (tx) => signTransactions(tx),
            r.transaction,
            r.txMeta,
          );
          signatures.push(result.signature);
        } catch (error) {
          if (isWalletError(error)) {
            // User rejected — stop processing remaining
            if (signatures.length > 0) {
              throw new Error(
                `Closed ${signatures.length} position(s), then cancelled. ${responses.length - signatures.length} remaining.`,
              );
            }
            throw toWalletActionError(error);
          }
          failures.push(error instanceof Error ? error.message : String(error));
        }
      }

      if (failures.length > 0 && signatures.length > 0) {
        throw new Error(
          `Closed ${signatures.length}/${responses.length} positions. ${failures.length} failed.`,
        );
      }
      if (failures.length > 0) {
        throw new Error(`All ${failures.length} close attempts failed.`);
      }
      return signatures;
    },
    onSuccess: () => {
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: ["prediction-positions", walletAddress],
        });
        queryClient.invalidateQueries({
          queryKey: ["prediction-orders", walletAddress],
        });
      }
    },
  });
}

export function useClaimPosition() {
  const queryClient = useQueryClient();
  const { account, signTransactions } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<
    RelayResult,
    Error,
    { positionPubkey: string; ownerPubkey: string; claimable?: boolean }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey, claimable }) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      if (claimable === false) {
        throw new Error("This position is not yet claimable.");
      }

      // SOL pre-check
      try {
        const balances = await fetchWalletBalances(walletAddress);
        if (balances.solLamports < 30_000_000) {
          throw new Error("Insufficient SOL for transaction fees. You need ~0.03 SOL.");
        }
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("Insufficient")) throw err;
        if (__DEV__) console.warn("[claimPosition] Balance check failed:", err);
      }

      let response: ClaimPositionResponse;
      try {
        response = await claimPosition(positionPubkey, ownerPubkey);
      } catch (err: unknown) {
        const httpErr = err as { response?: { json?: () => Promise<Record<string, string>> }; message?: string };
        const body = await httpErr?.response?.json?.().catch(() => null);
        throw new Error(body?.error ?? body?.message ?? httpErr?.message ?? "Failed to claim position");
      }

      try {
        return await signAndRelay(
          (tx) => signTransactions(tx),
          response.transaction,
          response.txMeta,
        );
      } catch (error) {
        if (isWalletError(error)) {
          throw toWalletActionError(error);
        }
        if (isTransactionExpired(error)) {
          const err = new Error("Transaction expired. Please try again.");
          (err as any).retryable = true;
          throw err;
        }
        throw await toRelayActionError(error);
      }
    },
    onSuccess: () => {
      if (walletAddress) {
        queryClient.invalidateQueries({
          queryKey: ["prediction-positions", walletAddress],
        });
        queryClient.invalidateQueries({
          queryKey: ["prediction-orders", walletAddress],
        });
      }
    },
  });
}
