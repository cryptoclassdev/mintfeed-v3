import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import {
  fetchTradingStatus,
  createOrder,
  closePosition,
  closeAllPositions,
  claimPosition,
  fetchOrders,
  fetchPositions,
} from "@/lib/prediction-client";
import {
  isWalletError,
  isTransactionExpired,
  sendPredictionTransaction,
  withTimeout,
  type TransactionMeta,
} from "@/lib/wallet";
import { fetchWalletBalances, getBalanceError } from "@/lib/balance";
import { useAppStore, type PendingPredictionTrade } from "@/lib/store";
import { shouldResolvePendingPredictionTrade } from "@/lib/prediction-trade-reconciliation";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ClaimPositionResponse,
  JupiterPaginatedResponse,
  PredictionPosition,
  TradingStatus,
} from "@midnight/shared";
import type { VersionedTransaction } from "@solana/web3.js";

const TRADING_STATUS_REFETCH_INTERVAL_MS = 30_000;
const CLOSE_POSITION_TIMEOUT_MS = 60_000;
const TRADE_REFRESH_DELAYS_MS = [0, 3_000, 8_000, 20_000, 45_000, 65_000] as const;
const SUBMISSION_RECONCILIATION_TIMEOUT_MS = 20_000;
const SUBMISSION_RECONCILIATION_INTERVAL_MS = 4_000;

export function toWalletActionError(error: unknown): Error {
  if (isWalletError(error)) {
    return new Error(error.message);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Wallet signing failed: ${message}`);
}

interface RelayResult {
  signature: string | null;
  status: "confirmed" | "pending";
  verification: "sent" | "uncertain";
}

interface WalletSubmissionResult {
  outcome: "sent" | "uncertain";
  signature: string | null;
}

async function signAndSend(
  sendFn: (tx: VersionedTransaction, minContextSlot?: number) => Promise<string>,
  unsignedTransaction: string,
  txMeta: TransactionMeta,
): Promise<WalletSubmissionResult> {
  try {
    const signature = await sendPredictionTransaction(
      sendFn,
      unsignedTransaction,
      txMeta,
    );
    return { outcome: "sent", signature };
  } catch (error) {
    if (
      isWalletError(error) &&
      error.code === "TRANSACTION_SUBMISSION_UNKNOWN"
    ) {
      return { outcome: "uncertain", signature: null };
    }
    throw error;
  }
}

function refreshTradingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  walletAddress: string | null,
): void {
  if (!walletAddress) return;

  queryClient.invalidateQueries({
    queryKey: ["prediction-positions", walletAddress],
  });
  queryClient.invalidateQueries({
    queryKey: ["prediction-orders", walletAddress],
  });
}

function scheduleTradingRefreshes(
  queryClient: ReturnType<typeof useQueryClient>,
  walletAddress: string | null,
): void {
  if (!walletAddress) return;

  for (const delayMs of TRADE_REFRESH_DELAYS_MS) {
    setTimeout(() => {
      refreshTradingQueries(queryClient, walletAddress);
    }, delayMs);
  }
}

function getCachedPositions(
  queryClient: ReturnType<typeof useQueryClient>,
  walletAddress: string,
): PredictionPosition[] {
  const cached =
    queryClient.getQueryData<JupiterPaginatedResponse<PredictionPosition>>([
      "prediction-positions",
      walletAddress,
      "cached",
    ]) ??
    queryClient.getQueryData<JupiterPaginatedResponse<PredictionPosition>>([
      "prediction-positions",
      walletAddress,
    ]);
  return cached?.data ?? [];
}

function getBaselineContracts(
  queryClient: ReturnType<typeof useQueryClient>,
  walletAddress: string,
  options: {
    marketId?: string;
    isYes?: boolean;
    positionPubkey?: string;
  },
): number {
  const positions = getCachedPositions(queryClient, walletAddress);
  const target = positions.find((position) =>
    options.positionPubkey
      ? position.pubkey === options.positionPubkey
      : position.marketId === options.marketId && position.isYes === options.isYes,
  );
  return target ? Number(positionContracts(target.contracts)) : 0;
}

function positionContracts(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function reconcileTradeSubmission(
  walletAddress: string,
  trade: PendingPredictionTrade,
): Promise<boolean> {
  const deadline = Date.now() + SUBMISSION_RECONCILIATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const [orders, positions] = await Promise.all([
      fetchOrders(walletAddress, { fresh: true }).catch(() => undefined),
      fetchPositions(walletAddress, { fresh: true }).catch(() => undefined),
    ]);

    if (shouldResolvePendingPredictionTrade(trade, orders, positions)) {
      return true;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, SUBMISSION_RECONCILIATION_INTERVAL_MS),
    );
  }

  return false;
}

function makePendingResult(
  verification: RelayResult["verification"],
  signature: string | null,
): RelayResult {
  return {
    signature,
    status: "pending",
    verification,
  };
}

function resolveWalletSubmission(
  walletAddress: string,
  submission: WalletSubmissionResult,
  trade: PendingPredictionTrade,
): RelayResult {
  if (submission.outcome === "sent") {
    return makePendingResult("sent", submission.signature);
  }

  const store = useAppStore.getState();
  store.upsertPendingPredictionTrade(trade);

  void reconcileTradeSubmission(walletAddress, trade).then((reconciled) => {
    if (reconciled) {
      useAppStore.getState().removePendingPredictionTrade(trade.id);
    }
  });

  return makePendingResult("uncertain", null);
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
  const { account, signAndSendTransactions } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<RelayResult, Error, CreateOrderRequest>({
    mutationFn: async (request) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      if (__DEV__) console.log("[createOrder] Request:", JSON.stringify(request));

      // Pre-flight balance check for buy orders — invalidate the cached
      // balance first so a stale "insufficient" result can't block a user
      // who just deposited funds.
      if (request.isBuy && request.depositAmount) {
        queryClient.invalidateQueries({ queryKey: ["wallet-balance", walletAddress] });
        try {
          const balances = await fetchWalletBalances(walletAddress);
          queryClient.setQueryData(["wallet-balance", walletAddress], balances);
          const balanceError = getBalanceError(balances, Number(request.depositAmount));
          if (balanceError) {
            const error = new Error(balanceError);
            (error as any).retryable = true;
            throw error;
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
        const submission = await signAndSend(
          (tx, minContextSlot) => signAndSendTransactions(tx, minContextSlot ?? 0),
          response.transaction,
          response.txMeta,
        );
        const pendingTrade: PendingPredictionTrade = {
          id: response.externalOrderId ?? `buy:${walletAddress}:${Date.now()}`,
          walletAddress,
          kind: "buy",
          verification: submission.outcome === "sent" ? "sent" : "uncertain",
          createdAt: Date.now(),
          marketId: request.marketId,
          isYes: request.isYes,
          amountUsd: request.depositAmount ? Number(request.depositAmount) / 1_000_000 : undefined,
          externalOrderId: response.externalOrderId ?? null,
          baselineContracts: getBaselineContracts(queryClient, walletAddress, {
            marketId: request.marketId,
            isYes: request.isYes,
          }),
        };
        const result = resolveWalletSubmission(walletAddress, submission, pendingTrade);
        if (__DEV__) {
          console.log(
            "[createOrder] TX signature:",
            result.signature,
            "status:",
            result.status,
            "verification:",
            result.verification,
          );
        }
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
        if (__DEV__) console.warn("[createOrder] Wallet send failed:", err);
        throw err instanceof Error
          ? err
          : new Error("Transaction broadcast failed. Try again.");
      }
    },
    onSuccess: () => {
      scheduleTradingRefreshes(queryClient, walletAddress);
    },
  });
}

export interface ClosePositionVariables {
  positionPubkey: string;
  ownerPubkey: string;
  isYes: boolean;
  contracts: string;
  /**
   * Fires right before the wallet signing prompt is expected. Callers use
   * this to flip UI from "preparing" to "signing" only after the network
   * round-trip has resolved — so a slow API response doesn't leave users
   * stuck on "Signing..." while nothing has been sent to the wallet yet.
   */
  onBeforeSign?: () => void;
}

export function useClosePosition() {
  const queryClient = useQueryClient();
  const { account, signAndSendTransactions } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<RelayResult, Error, ClosePositionVariables>({
    mutationFn: async ({ positionPubkey, ownerPubkey, isYes, contracts, onBeforeSign }) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      // SOL pre-check (closing needs fees)
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", walletAddress] });
      try {
        const balances = await fetchWalletBalances(walletAddress);
        queryClient.setQueryData(["wallet-balance", walletAddress], balances);
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

      // API is done — from here on we are waiting on the wallet send flow.
      onBeforeSign?.();

      try {
        const submission = await withTimeout(
          signAndSend(
            (tx, minContextSlot) => signAndSendTransactions(tx, minContextSlot ?? 0),
            response.transaction,
            response.txMeta,
          ),
          CLOSE_POSITION_TIMEOUT_MS,
          "Close position",
        );
        return resolveWalletSubmission(walletAddress, submission, {
          id: response.externalOrderId ?? `close:${positionPubkey}:${Date.now()}`,
          walletAddress,
          kind: "close",
          verification: submission.outcome === "sent" ? "sent" : "uncertain",
          createdAt: Date.now(),
          marketId: (response.order as { marketId?: string }).marketId,
          positionPubkey,
          isYes,
          externalOrderId: response.externalOrderId ?? null,
          baselineContracts: getBaselineContracts(queryClient, walletAddress, {
            positionPubkey,
          }),
        });
      } catch (error) {
        if (isWalletError(error)) {
          throw toWalletActionError(error);
        }
        if (isTransactionExpired(error)) {
          const err = new Error("Transaction expired. Please try again.");
          (err as any).retryable = true;
          throw err;
        }
        if (error instanceof Error && /timed out/i.test(error.message)) {
          const err = new Error(
            "Wallet did not respond in time. Please try again.",
          );
          (err as any).retryable = true;
          throw err;
        }
        throw error instanceof Error
          ? error
          : new Error("Transaction broadcast failed. Try again.");
      }
    },
    onSuccess: () => {
      scheduleTradingRefreshes(queryClient, walletAddress);
    },
  });
}

export function useCloseAllPositions() {
  const queryClient = useQueryClient();
  const { account, signAndSendTransactions } = useMobileWallet();
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
          const result = await signAndSend(
            (tx, minContextSlot) => signAndSendTransactions(tx, minContextSlot ?? 0),
            r.transaction,
            r.txMeta,
          );
          if (result.signature) {
            signatures.push(result.signature);
          }
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
      scheduleTradingRefreshes(queryClient, walletAddress);
    },
  });
}

export function useClaimPosition() {
  const queryClient = useQueryClient();
  const { account, signAndSendTransactions } = useMobileWallet();
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
        const submission = await signAndSend(
          (tx, minContextSlot) => signAndSendTransactions(tx, minContextSlot ?? 0),
          response.transaction,
          response.txMeta,
        );
        return resolveWalletSubmission(walletAddress, submission, {
          id: `claim:${positionPubkey}:${Date.now()}`,
          walletAddress,
          kind: "claim",
          verification: submission.outcome === "sent" ? "sent" : "uncertain",
          createdAt: Date.now(),
          positionPubkey,
          baselineContracts: getBaselineContracts(queryClient, walletAddress, {
            positionPubkey,
          }),
        });
      } catch (error) {
        if (isWalletError(error)) {
          throw toWalletActionError(error);
        }
        if (isTransactionExpired(error)) {
          const err = new Error("Transaction expired. Please try again.");
          (err as any).retryable = true;
          throw err;
        }
        throw error instanceof Error
          ? error
          : new Error("Transaction broadcast failed. Try again.");
      }
    },
    onSuccess: () => {
      scheduleTradingRefreshes(queryClient, walletAddress);
    },
  });
}
