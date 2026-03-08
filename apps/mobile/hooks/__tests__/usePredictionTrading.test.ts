import { describe, expect, it, jest } from "@jest/globals";

jest.mock("@/lib/wallet", () => ({
  isWalletError: (error: unknown) =>
    error instanceof Error &&
    typeof (error as { code?: string }).code === "string",
}));

import { toWalletActionError } from "../usePredictionTrading";

class MockWalletError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
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
