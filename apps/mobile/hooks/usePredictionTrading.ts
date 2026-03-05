import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTradingStatus,
  createOrder,
  closePosition,
  closeAllPositions,
  claimPosition,
} from "@/lib/prediction-client";
import { mwaSignAndSend } from "@/lib/wallet-adapter";
import { useAppStore } from "@/lib/store";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ClaimPositionResponse,
  TradingStatus,
} from "@mintfeed/shared";

const TRADING_STATUS_REFETCH_INTERVAL_MS = 30_000;

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

  return useMutation<string, Error, CreateOrderRequest>({
    mutationFn: async (request) => {
      if (!walletAuthToken || !walletAddress) {
        throw new Error("Wallet not connected");
      }

      console.log("[createOrder] Request:", JSON.stringify(request));

      let response: CreateOrderResponse;
      try {
        response = await createOrder(request);
      } catch (err: any) {
        const body = await err?.response?.json?.().catch(() => null);
        console.error("[createOrder] API error:", err?.response?.status, JSON.stringify(body), err?.message);
        const code = body?.code ?? "";
        if (code === "transaction_simulation_failed" || code === "ANCHOR_6025" || code === "INSUFFICIENT_FUNDS") {
          throw new Error("Insufficient balance. You need both USDC (for the bet) and SOL (≈0.03 for fees/rent).");
        }
        throw new Error(body?.message ?? err?.message ?? "Failed to create order");
      }

      console.log("[createOrder] Response:", JSON.stringify({
        transaction: response.transaction ? `${response.transaction.slice(0, 40)}...` : null,
        order: response.order,
      }));

      try {
        const result = await mwaSignAndSend(response.transaction, walletAuthToken);
        if (result.authToken !== walletAuthToken) {
          connectWallet(walletAddress, result.authToken);
        }
        console.log("[createOrder] TX signature:", result.signature);
        return result.signature;
      } catch (err: any) {
        console.error("[createOrder] MWA sign/send failed:", err?.message, String(err));
        throw new Error(`Wallet signing failed: ${err?.message ?? String(err)}`);
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

  return useMutation<
    string,
    Error,
    { positionPubkey: string; ownerPubkey: string }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey }) => {
      if (!walletAuthToken || !walletAddress) {
        throw new Error("Wallet not connected");
      }
      const response: CreateOrderResponse = await closePosition(
        positionPubkey,
        ownerPubkey,
      );
      const result = await mwaSignAndSend(response.transaction, walletAuthToken);
      if (result.authToken !== walletAuthToken) {
        connectWallet(walletAddress, result.authToken);
      }
      return result.signature;
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

  return useMutation<string[], Error, { ownerPubkey: string }>({
    mutationFn: async ({ ownerPubkey }) => {
      if (!walletAuthToken || !walletAddress) {
        throw new Error("Wallet not connected");
      }
      const responses: CreateOrderResponse[] =
        await closeAllPositions(ownerPubkey);
      let currentToken = walletAuthToken;
      const signatures: string[] = [];
      for (const r of responses) {
        const result = await mwaSignAndSend(r.transaction, currentToken);
        currentToken = result.authToken;
        signatures.push(result.signature);
      }
      if (currentToken !== walletAuthToken) {
        connectWallet(walletAddress, currentToken);
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

  return useMutation<
    string,
    Error,
    { positionPubkey: string; ownerPubkey: string }
  >({
    mutationFn: async ({ positionPubkey, ownerPubkey }) => {
      if (!walletAuthToken || !walletAddress) {
        throw new Error("Wallet not connected");
      }
      const response: ClaimPositionResponse = await claimPosition(
        positionPubkey,
        ownerPubkey,
      );
      const result = await mwaSignAndSend(response.transaction, walletAuthToken);
      if (result.authToken !== walletAuthToken) {
        connectWallet(walletAddress, result.authToken);
      }
      return result.signature;
    },
    onSuccess: () => {
      if (walletAddress) {
        queryClient.invalidateQueries({ queryKey: ["prediction-positions", walletAddress] });
        queryClient.invalidateQueries({ queryKey: ["prediction-orders", walletAddress] });
      }
    },
  });
}
