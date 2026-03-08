import { describe, expect, it, jest } from "@jest/globals";
jest.mock("@/lib/wallet-adapter", () => ({
  isWalletTransactionError: (error: unknown) =>
    error instanceof Error && typeof (error as { code?: string }).code === "string",
  mwaSignAndSend: jest.fn(),
}));

import { toWalletActionError } from "../usePredictionTrading";

class MockWalletTransactionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

describe("usePredictionTrading wallet recovery", () => {
  it("disconnects and returns reconnect copy for expired wallet sessions", () => {
    const disconnectWallet = jest.fn();

    const error = toWalletActionError(
      new MockWalletTransactionError("WALLET_SESSION_EXPIRED", "Wallet session expired. Reconnect your wallet and try again."),
      disconnectWallet,
    );

    expect(error.message).toBe("Wallet session expired. Reconnect your wallet and try again.");
    expect(disconnectWallet).toHaveBeenCalledTimes(1);
  });

  it("does not disconnect for wallet approval rejection", () => {
    const disconnectWallet = jest.fn();

    const error = toWalletActionError(
      new MockWalletTransactionError("WALLET_APPROVAL_REJECTED", "Transaction cancelled in wallet."),
      disconnectWallet,
    );

    expect(error.message).toBe("Transaction cancelled in wallet.");
    expect(disconnectWallet).not.toHaveBeenCalled();
  });

  it("does not disconnect for expired transactions and returns retry copy", () => {
    const disconnectWallet = jest.fn();

    const error = toWalletActionError(
      new MockWalletTransactionError("TRANSACTION_EXPIRED", "Transaction expired before approval. Try placing the bet again."),
      disconnectWallet,
    );

    expect(error.message).toBe("Transaction expired before approval. Try placing the bet again.");
    expect(disconnectWallet).not.toHaveBeenCalled();
  });
});
