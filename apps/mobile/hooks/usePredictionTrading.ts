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
  signPredictionTransaction,
  type TransactionMeta,
} from "@/lib/wallet";
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

async function signAndRelay(
  signFn: SignFn,
  unsignedTransaction: string,
  txMeta: TransactionMeta,
): Promise<string> {
  const signedTransaction = await signPredictionTransaction(
    signFn,
    unsignedTransaction,
    txMeta,
  );
  const result = await submitSignedTransaction({ signedTransaction, txMeta });
  return result.signature;
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
  const { account, signTransaction } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<string, Error, CreateOrderRequest>({
    mutationFn: async (request) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      if (__DEV__) console.log("[createOrder] Request:", JSON.stringify(request));

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
          console.error(
            "[createOrder] API error:",
            httpErr?.response?.status,
            JSON.stringify(body),
            httpErr?.message,
          );
        const code = body?.code ?? "";
        if (
          code === "transaction_simulation_failed" ||
          code === "ANCHOR_6025" ||
          code === "INSUFFICIENT_FUNDS"
        ) {
          throw new Error(
            "Insufficient balance. You need both USDC (for the bet) and SOL (\u22480.03 for fees/rent).",
          );
        }
        throw new Error(
          body?.message ?? httpErr?.message ?? "Failed to create order",
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
        const signature = await signAndRelay(
          (tx) => signTransaction(tx),
          response.transaction,
          response.txMeta,
        );
        if (__DEV__) console.log("[createOrder] TX signature:", signature);
        return signature;
      } catch (err: unknown) {
        if (isWalletError(err)) {
          if (__DEV__) console.error("[createOrder] MWA sign failed:", err);
          throw toWalletActionError(err);
        }
        if (__DEV__) console.error("[createOrder] Relay failed:", err);
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
  const { account, signTransaction } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<
    string,
    Error,
    { positionPubkey: string; ownerPubkey: string; isYes: boolean; contracts: string }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey, isYes, contracts }) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      try {
        const response: CreateOrderResponse = await closePosition(
          positionPubkey,
          ownerPubkey,
          isYes,
          contracts,
        );
        return await signAndRelay(
          (tx) => signTransaction(tx),
          response.transaction,
          response.txMeta,
        );
      } catch (error) {
        if (isWalletError(error)) {
          throw toWalletActionError(error);
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

export function useCloseAllPositions() {
  const queryClient = useQueryClient();
  const { account, signTransaction } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<string[], Error, { ownerPubkey: string }>({
    mutationFn: async ({ ownerPubkey }) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      const responses: CreateOrderResponse[] =
        await closeAllPositions(ownerPubkey);
      const signatures: string[] = [];
      try {
        for (const r of responses) {
          const signature = await signAndRelay(
            (tx) => signTransaction(tx),
            r.transaction,
            r.txMeta,
          );
          signatures.push(signature);
        }
      } catch (error) {
        if (isWalletError(error)) {
          throw toWalletActionError(error);
        }
        throw await toRelayActionError(error);
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
  const { account, signTransaction } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  return useMutation<
    string,
    Error,
    { positionPubkey: string; ownerPubkey: string }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey }) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      try {
        const response: ClaimPositionResponse = await claimPosition(
          positionPubkey,
          ownerPubkey,
        );
        return await signAndRelay(
          (tx) => signTransaction(tx),
          response.transaction,
          response.txMeta,
        );
      } catch (error) {
        if (isWalletError(error)) {
          throw toWalletActionError(error);
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
