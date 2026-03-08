import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTradingStatus,
  createOrder,
  submitSignedTransaction,
  closePosition,
  closeAllPositions,
  claimPosition,
} from "@/lib/prediction-client";
import {
  isWalletTransactionError,
  mwaSignTransaction,
} from "@/lib/wallet-adapter";
import { useAppStore } from "@/lib/store";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ClaimPositionResponse,
  TradingStatus,
} from "@mintfeed/shared";

const TRADING_STATUS_REFETCH_INTERVAL_MS = 30_000;

export function toWalletActionError(error: unknown, disconnectWallet: () => void): Error {
  if (isWalletTransactionError(error)) {
    if (
      error.code === "WALLET_SESSION_EXPIRED"
      || error.code === "WALLET_ACCOUNT_MISMATCH"
    ) {
      disconnectWallet();
    }
    return new Error(error.message);
  }

  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Wallet signing failed: ${message}`);
}

export async function toRelayActionError(error: unknown): Promise<Error> {
  const httpErr = error as { response?: { json?: () => Promise<Record<string, string>> }; message?: string };
  const body = await httpErr?.response?.json?.().catch(() => null);
  const message = body?.message ?? httpErr?.message ?? "Transaction broadcast failed. Try again.";
  return new Error(message);
}

async function signAndRelayTransaction(
  unsignedTransaction: string,
  txMeta: CreateOrderResponse["txMeta"] | ClaimPositionResponse["txMeta"],
  walletAuthToken: string,
  walletAddress: string,
  connectWallet: (address: string, authToken: string) => void,
): Promise<{ signature: string; authToken: string }> {
  const signed = await mwaSignTransaction(
    unsignedTransaction,
    walletAuthToken,
    txMeta,
    walletAddress,
  );

  if (signed.authToken !== walletAuthToken) {
    connectWallet(walletAddress, signed.authToken);
  }

  const result = await submitSignedTransaction({
    signedTransaction: signed.signedTransaction,
    txMeta,
  });

  return {
    signature: result.signature,
    authToken: signed.authToken,
  };
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
  const walletAddress = useAppStore((s) => s.walletAddress);
  const walletAuthToken = useAppStore((s) => s.walletAuthToken);
  const connectWallet = useAppStore((s) => s.connectWallet);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);

  return useMutation<string, Error, CreateOrderRequest>({
    mutationFn: async (request) => {
      if (!walletAuthToken || !walletAddress) {
        throw new Error("Wallet not connected");
      }

      if (__DEV__) console.log("[createOrder] Request:", JSON.stringify(request));

      let response: CreateOrderResponse;
      try {
        response = await createOrder(request);
      } catch (err: unknown) {
        const httpErr = err as { response?: { json?: () => Promise<Record<string, string>>; status?: number }; message?: string };
        const body = await httpErr?.response?.json?.().catch(() => null);
        if (__DEV__) console.error("[createOrder] API error:", httpErr?.response?.status, JSON.stringify(body), httpErr?.message);
        const code = body?.code ?? "";
        if (code === "transaction_simulation_failed" || code === "ANCHOR_6025" || code === "INSUFFICIENT_FUNDS") {
          throw new Error("Insufficient balance. You need both USDC (for the bet) and SOL (≈0.03 for fees/rent).");
        }
        throw new Error(body?.message ?? httpErr?.message ?? "Failed to create order");
      }

      if (__DEV__) console.log("[createOrder] Response:", JSON.stringify({
        transaction: response.transaction ? `${response.transaction.slice(0, 40)}...` : null,
        order: response.order,
      }));

      try {
        const result = await signAndRelayTransaction(
          response.transaction,
          response.txMeta,
          walletAuthToken,
          walletAddress,
          connectWallet,
        );
        if (__DEV__) console.log("[createOrder] TX signature:", result.signature);
        return result.signature;
      } catch (err: unknown) {
        if (isWalletTransactionError(err)) {
          if (__DEV__) console.error("[createOrder] MWA sign failed:", err);
          throw toWalletActionError(err, disconnectWallet);
        }
        if (__DEV__) console.error("[createOrder] Relay failed:", err);
        throw await toRelayActionError(err);
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

export function useClosePosition() {
  const queryClient = useQueryClient();
  const walletAddress = useAppStore((s) => s.walletAddress);
  const walletAuthToken = useAppStore((s) => s.walletAuthToken);
  const connectWallet = useAppStore((s) => s.connectWallet);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);

  return useMutation<
    string,
    Error,
    { positionPubkey: string; ownerPubkey: string }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey }) => {
      try {
        if (!walletAuthToken || !walletAddress) {
          throw new Error("Wallet not connected");
        }
        const response: CreateOrderResponse = await closePosition(
          positionPubkey,
          ownerPubkey,
        );
        const result = await signAndRelayTransaction(
          response.transaction,
          response.txMeta,
          walletAuthToken,
          walletAddress,
          connectWallet,
        );
        return result.signature;
      } catch (error) {
        if (isWalletTransactionError(error)) {
          throw toWalletActionError(error, disconnectWallet);
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
  const walletAddress = useAppStore((s) => s.walletAddress);
  const walletAuthToken = useAppStore((s) => s.walletAuthToken);
  const connectWallet = useAppStore((s) => s.connectWallet);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);

  return useMutation<string[], Error, { ownerPubkey: string }>({
    mutationFn: async ({ ownerPubkey }) => {
      if (!walletAuthToken || !walletAddress) {
        throw new Error("Wallet not connected");
      }
      const responses: CreateOrderResponse[] =
        await closeAllPositions(ownerPubkey);
      const signatures: string[] = [];
      let currentAuthToken = walletAuthToken;
      try {
        for (const r of responses) {
          const result = await signAndRelayTransaction(
            r.transaction,
            r.txMeta,
            currentAuthToken,
            walletAddress,
            connectWallet,
          );
          currentAuthToken = result.authToken;
          signatures.push(result.signature);
        }
      } catch (error) {
        if (isWalletTransactionError(error)) {
          throw toWalletActionError(error, disconnectWallet);
        }
        throw await toRelayActionError(error);
      }
      return signatures;
    },
    onSuccess: () => {
      if (walletAddress) {
        queryClient.invalidateQueries({ queryKey: ["prediction-positions", walletAddress] });
        queryClient.invalidateQueries({ queryKey: ["prediction-orders", walletAddress] });
      }
    },
  });
}

export function useClaimPosition() {
  const queryClient = useQueryClient();
  const walletAddress = useAppStore((s) => s.walletAddress);
  const walletAuthToken = useAppStore((s) => s.walletAuthToken);
  const connectWallet = useAppStore((s) => s.connectWallet);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);

  return useMutation<
    string,
    Error,
    { positionPubkey: string; ownerPubkey: string }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey }) => {
      try {
        if (!walletAuthToken || !walletAddress) {
          throw new Error("Wallet not connected");
        }
        const response: ClaimPositionResponse = await claimPosition(
          positionPubkey,
          ownerPubkey,
        );
        const result = await signAndRelayTransaction(
          response.transaction,
          response.txMeta,
          walletAuthToken,
          walletAddress,
          connectWallet,
        );
        return result.signature;
      } catch (error) {
        if (isWalletTransactionError(error)) {
          throw toWalletActionError(error, disconnectWallet);
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
