import React, { type ReactNode } from "react";
import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";

jest.mock("@/lib/wallet", () => ({
  isWalletError: (error: unknown) =>
    error instanceof Error &&
    typeof (error as { code?: string }).code === "string",
  isTransactionExpired: jest.fn(() => false),
  sendPredictionTransaction: jest.fn(() => Promise.resolve("signature")),
  withTimeout: jest.fn((promise: Promise<unknown>) => promise),
}));

jest.mock("@/lib/prediction-client", () => ({
  fetchTradingStatus: jest.fn(),
  createOrder: jest.fn(),
  closePosition: jest.fn(),
  closeAllPositions: jest.fn(),
  claimPosition: jest.fn(),
  fetchOrders: jest.fn(),
  fetchPositions: jest.fn(),
}));

jest.mock("@/lib/balance", () => {
  const actual = jest.requireActual<typeof import("@/lib/balance")>(
    "@/lib/balance",
  );
  return {
    ...actual,
    fetchWalletBalances: jest.fn(),
  };
});

jest.mock("@/lib/solana-fees", () => ({
  estimateSolRequirementForTransaction: jest.fn(),
  estimateSolRequirementForTransactions: jest.fn(),
}));

import { fetchWalletBalances } from "@/lib/balance";
import {
  claimPosition,
  closeAllPositions,
  closePosition,
  createOrder,
  fetchOrders,
  fetchPositions,
} from "@/lib/prediction-client";
import {
  estimateSolRequirementForTransaction,
  estimateSolRequirementForTransactions,
} from "@/lib/solana-fees";
import { sendPredictionTransaction } from "@/lib/wallet";
import {
  toWalletActionError,
  useClaimPosition,
  useCloseAllPositions,
  useClosePosition,
  useCreateOrder,
} from "../usePredictionTrading";

const mockedFetchWalletBalances =
  fetchWalletBalances as jest.MockedFunction<typeof fetchWalletBalances>;
const mockedCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>;
const mockedClosePosition =
  closePosition as jest.MockedFunction<typeof closePosition>;
const mockedCloseAllPositions =
  closeAllPositions as jest.MockedFunction<typeof closeAllPositions>;
const mockedClaimPosition =
  claimPosition as jest.MockedFunction<typeof claimPosition>;
const mockedFetchOrders =
  fetchOrders as jest.MockedFunction<typeof fetchOrders>;
const mockedFetchPositions =
  fetchPositions as jest.MockedFunction<typeof fetchPositions>;
const mockedEstimateSolRequirementForTransaction =
  estimateSolRequirementForTransaction as jest.MockedFunction<
    typeof estimateSolRequirementForTransaction
  >;
const mockedEstimateSolRequirementForTransactions =
  estimateSolRequirementForTransactions as jest.MockedFunction<
    typeof estimateSolRequirementForTransactions
  >;
const mockedSendPredictionTransaction =
  sendPredictionTransaction as jest.MockedFunction<
    typeof sendPredictionTransaction
  >;

class MockWalletError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const txMeta = {
  blockhash: "blockhash",
  lastValidBlockHeight: 100,
};

const orderResponse = {
  transaction: "base64-transaction",
  txMeta,
  externalOrderId: "external-order",
  order: { marketId: "market-1" },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function mockWallet() {
  (useMobileWallet as jest.Mock).mockReturnValue({
    account: { address: { toString: () => "wallet-1" } },
    signAndSendTransactions: jest.fn(),
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockWallet();
  mockedFetchWalletBalances.mockResolvedValue({
    solLamports: 18_000_000,
    usdcMicroAmount: 5_830_000,
  });
  mockedEstimateSolRequirementForTransaction.mockResolvedValue({
    feeLamports: 5_000,
    bufferLamports: 5_000_000,
    requiredLamports: 5_005_000,
    source: "feeForMessage",
  });
  mockedEstimateSolRequirementForTransactions.mockResolvedValue({
    feeLamports: 11_000,
    bufferLamports: 5_000_000,
    requiredLamports: 5_011_000,
    source: "feeForMessage",
  });
  mockedCreateOrder.mockResolvedValue(orderResponse as any);
  mockedClosePosition.mockResolvedValue(orderResponse as any);
  mockedCloseAllPositions.mockResolvedValue([
    orderResponse,
    { ...orderResponse, transaction: "base64-transaction-2" },
  ] as any);
  mockedClaimPosition.mockResolvedValue(orderResponse as any);
  mockedFetchOrders.mockResolvedValue({ data: [] } as any);
  mockedFetchPositions.mockResolvedValue({ data: [] } as any);
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

async function mutateInAct<T>(mutation: Promise<T>): Promise<T> {
  let value: T | undefined;
  await act(async () => {
    value = await mutation;
  });
  return value as T;
}

async function captureMutationError(mutation: Promise<unknown>): Promise<unknown> {
  let mutationError: unknown;
  await act(async () => {
    try {
      await mutation;
    } catch (error) {
      mutationError = error;
    }
  });
  return mutationError;
}

describe("usePredictionTrading wallet error handling", () => {
  it("returns wallet error message for wallet errors", () => {
    const error = toWalletActionError(
      new MockWalletError(
        "WALLET_APPROVAL_REJECTED",
        "Transaction cancelled in wallet.",
      ),
    );
    expect(error.message).toBe("Transaction cancelled in wallet.");
  });

  it("returns retry copy for expired transactions", () => {
    const error = toWalletActionError(
      new MockWalletError(
        "TRANSACTION_EXPIRED",
        "Transaction expired before approval. Try placing the bet again.",
      ),
    );
    expect(error.message).toBe(
      "Transaction expired before approval. Try placing the bet again.",
    );
  });

  it("wraps non-wallet errors with signing context", () => {
    const error = toWalletActionError(new Error("Network timeout"));
    expect(error.message).toBe("Wallet signing failed: Network timeout");
  });

  it("handles non-Error values", () => {
    const error = toWalletActionError("string error");
    expect(error.message).toBe("Wallet signing failed: string error");
  });
});

describe("usePredictionTrading dynamic balance checks", () => {
  it("lets buy orders pass with enough USDC even when SOL is below the old 0.03 threshold", async () => {
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    await expect(
      mutateInAct(result.current.mutateAsync({
        ownerPubkey: "wallet-1",
        marketId: "market-1",
        isYes: true,
        isBuy: true,
        depositAmount: "5010000",
        depositMint: "USDC",
      })),
    ).resolves.toEqual({
      signature: "signature",
      status: "pending",
      verification: "sent",
    });

    expect(createOrder).toHaveBeenCalled();
    expect(estimateSolRequirementForTransaction).toHaveBeenCalledWith(
      "base64-transaction",
    );
    expect(sendPredictionTransaction).toHaveBeenCalled();
  });

  it("still blocks buy orders before API creation when USDC is insufficient", async () => {
    mockedFetchWalletBalances.mockResolvedValue({
      solLamports: 18_000_000,
      usdcMicroAmount: 1_000_000,
    });
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    const error = await captureMutationError(result.current.mutateAsync({
        ownerPubkey: "wallet-1",
        marketId: "market-1",
        isYes: true,
        isBuy: true,
        depositAmount: "5010000",
        depositMint: "USDC",
      }));

    expect(error).toEqual(
      expect.objectContaining({
        message: "Insufficient USDC. You have $1.00 but need $5.01.",
      }),
    );

    expect(createOrder).not.toHaveBeenCalled();
    expect(estimateSolRequirementForTransaction).not.toHaveBeenCalled();
  });

  it("blocks buy orders after API creation when dynamic SOL requirement is not covered", async () => {
    mockedFetchWalletBalances.mockResolvedValue({
      solLamports: 1_000_000,
      usdcMicroAmount: 5_830_000,
    });
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    const error = await captureMutationError(result.current.mutateAsync({
        ownerPubkey: "wallet-1",
        marketId: "market-1",
        isYes: true,
        isBuy: true,
        depositAmount: "5010000",
        depositMint: "USDC",
      }));

    expect(error).toEqual(
      expect.objectContaining({
        message:
          "Need about 0.005005 SOL for network fees. You have 0.001 SOL.",
      }),
    );

    expect(createOrder).toHaveBeenCalled();
    expect(sendPredictionTransaction).not.toHaveBeenCalled();
  });

  it("checks close and claim transactions against the returned transaction fee", async () => {
    const closeHook = renderHook(() => useClosePosition(), {
      wrapper: createWrapper(),
    });
    const claimHook = renderHook(() => useClaimPosition(), {
      wrapper: createWrapper(),
    });

    await expect(
      mutateInAct(closeHook.result.current.mutateAsync({
        positionPubkey: "position-1",
        ownerPubkey: "wallet-1",
        isYes: true,
        contracts: "10",
      })),
    ).resolves.toEqual({
      signature: "signature",
      status: "pending",
      verification: "sent",
    });

    await expect(
      mutateInAct(claimHook.result.current.mutateAsync({
        positionPubkey: "position-1",
        ownerPubkey: "wallet-1",
        claimable: true,
      })),
    ).resolves.toEqual({
      signature: "signature",
      status: "pending",
      verification: "sent",
    });

    expect(estimateSolRequirementForTransaction).toHaveBeenCalledTimes(2);
  });

  it("proceeds with order creation when the balance RPC fails", async () => {
    mockedFetchWalletBalances.mockRejectedValue(new Error("rpc unavailable"));
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    await expect(
      mutateInAct(result.current.mutateAsync({
        ownerPubkey: "wallet-1",
        marketId: "market-1",
        isYes: true,
        isBuy: true,
        depositAmount: "5010000",
        depositMint: "USDC",
      })),
    ).resolves.toEqual({
      signature: "signature",
      status: "pending",
      verification: "sent",
    });

    expect(mockedCreateOrder).toHaveBeenCalledTimes(1);
    expect(mockedSendPredictionTransaction).toHaveBeenCalledTimes(1);
  });

  it("maps API insufficient-funds errors into trading copy", async () => {
    mockedCreateOrder.mockRejectedValue({
      response: {
        status: 400,
        json: async () => ({ code: "INSUFFICIENT_FUNDS" }),
      },
      message: "bad request",
    });
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    const error = await captureMutationError(result.current.mutateAsync({
      ownerPubkey: "wallet-1",
      marketId: "market-1",
      isYes: true,
      isBuy: true,
      depositAmount: "5010000",
      depositMint: "USDC",
    }));

    expect(error).toEqual(
      expect.objectContaining({
        message:
          "Insufficient balance. You need enough USDC for the bet and a small amount of SOL for network fees.",
      }),
    );
  });

  it("returns an uncertain submission when the wallet cannot confirm local handoff", async () => {
    const submissionUnknownError = Object.assign(
      new Error("unknown submission"),
      { code: "TRANSACTION_SUBMISSION_UNKNOWN" },
    );
    mockedSendPredictionTransaction.mockRejectedValueOnce(submissionUnknownError);
    mockedFetchOrders.mockResolvedValue({
      data: [{ externalOrderId: "external-order", marketId: "market-1", isYes: true, isBuy: true }],
    } as any);
    const { result } = renderHook(() => useCreateOrder(), {
      wrapper: createWrapper(),
    });

    await expect(
      mutateInAct(result.current.mutateAsync({
        ownerPubkey: "wallet-1",
        marketId: "market-1",
        isYes: true,
        isBuy: true,
        depositAmount: "5010000",
        depositMint: "USDC",
      })),
    ).resolves.toEqual({
      signature: null,
      status: "pending",
      verification: "uncertain",
    });

    expect(mockedFetchOrders).toHaveBeenCalledWith("wallet-1", { fresh: true });
    expect(mockedFetchPositions).toHaveBeenCalledWith("wallet-1", { fresh: true });
  });

  it("checks close-all transactions using summed fees plus one safety buffer", async () => {
    const { result } = renderHook(() => useCloseAllPositions(), {
      wrapper: createWrapper(),
    });

    await expect(
      mutateInAct(result.current.mutateAsync({ ownerPubkey: "wallet-1" })),
    ).resolves.toEqual(["signature", "signature"]);

    expect(estimateSolRequirementForTransactions).toHaveBeenCalledWith([
      "base64-transaction",
      "base64-transaction-2",
    ]);
  });

  it("does not require a SOL fee check when close-all returns no transactions", async () => {
    mockedCloseAllPositions.mockResolvedValue([] as any);
    const { result } = renderHook(() => useCloseAllPositions(), {
      wrapper: createWrapper(),
    });

    await expect(
      mutateInAct(result.current.mutateAsync({ ownerPubkey: "wallet-1" })),
    ).resolves.toEqual([]);

    expect(estimateSolRequirementForTransactions).not.toHaveBeenCalled();
    expect(fetchWalletBalances).not.toHaveBeenCalled();
  });
});
