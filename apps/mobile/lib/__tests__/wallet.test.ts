import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { VersionedTransaction } from "@solana/web3.js";

jest.mock("@wallet-ui/react-native-web3js", () => ({
  toUint8Array: jest.fn((b64: string) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }),
  fromUint8Array: jest.fn((bytes: Uint8Array) => {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }),
}));

jest.mock("@/lib/solana", () => ({
  withSolanaConnectionFallbacks: jest.fn(),
}));
import {
  WalletError,
  isWalletError,
  walletError,
  isUserRejection,
  isTransactionExpired,
  ensureTransactionValid,
  signPredictionTransaction,
} from "../wallet";
import { withSolanaConnectionFallbacks } from "@/lib/solana";

const mockWithFallbacks = withSolanaConnectionFallbacks as jest.MockedFunction<
  typeof withSolanaConnectionFallbacks
>;

describe("WalletError", () => {
  it("constructs with code and message", () => {
    const error = new WalletError(
      "TRANSACTION_EXPIRED",
      "Transaction expired",
    );
    expect(error.code).toBe("TRANSACTION_EXPIRED");
    expect(error.message).toBe("Transaction expired");
    expect(error.name).toBe("WalletError");
  });

  it("preserves cause", () => {
    const cause = new Error("original");
    const error = new WalletError("TRANSACTION_SEND_FAILED", "Failed", {
      cause,
    });
    expect((error as { cause: unknown }).cause).toBe(cause);
  });
});

describe("isWalletError", () => {
  it("returns true for WalletError instances", () => {
    expect(isWalletError(walletError("TRANSACTION_EXPIRED"))).toBe(true);
  });

  it("returns true for errors with valid wallet error codes", () => {
    const error = Object.assign(new Error("test"), {
      code: "WALLET_APPROVAL_REJECTED",
    });
    expect(isWalletError(error)).toBe(true);
  });

  it("returns false for plain errors", () => {
    expect(isWalletError(new Error("nope"))).toBe(false);
  });

  it("returns false for non-errors", () => {
    expect(isWalletError("string")).toBe(false);
    expect(isWalletError(null)).toBe(false);
  });
});

describe("walletError", () => {
  it("builds WALLET_APPROVAL_REJECTED", () => {
    const err = walletError("WALLET_APPROVAL_REJECTED");
    expect(err.code).toBe("WALLET_APPROVAL_REJECTED");
    expect(err.message).toBe("Transaction cancelled in wallet.");
  });

  it("builds TRANSACTION_EXPIRED", () => {
    const err = walletError("TRANSACTION_EXPIRED");
    expect(err.code).toBe("TRANSACTION_EXPIRED");
    expect(err.message).toContain("expired");
  });

  it("builds TRANSACTION_SEND_FAILED", () => {
    const err = walletError("TRANSACTION_SEND_FAILED");
    expect(err.code).toBe("TRANSACTION_SEND_FAILED");
    expect(err.message).toContain("broadcast failed");
  });
});

describe("isUserRejection", () => {
  it.each([
    "User rejected the request",
    "Transaction declined by user",
    "Action cancelled",
    "Permission denied",
    "User dismissed the dialog",
    "Request aborted",
    "Requires approval",
  ])('detects "%s" as user rejection', (message) => {
    expect(isUserRejection(new Error(message))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isUserRejection(new Error("Network timeout"))).toBe(false);
  });
});

describe("isTransactionExpired", () => {
  it.each([
    "Blockhash not found",
    "Transaction's block height exceeded",
    "Transaction expired",
    "lastValidBlockHeight exceeded",
  ])('detects "%s" as expired', (message) => {
    expect(isTransactionExpired(new Error(message))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isTransactionExpired(new Error("Insufficient balance"))).toBe(false);
  });
});

describe("ensureTransactionValid", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes when block height is below limit", async () => {
    mockWithFallbacks.mockImplementation(async (fn) =>
      fn({ getBlockHeight: async () => 100 } as never),
    );

    await expect(
      ensureTransactionValid({ blockhash: "abc", lastValidBlockHeight: 200 }),
    ).resolves.toBeUndefined();
  });

  it("throws TRANSACTION_EXPIRED when block height exceeds limit", async () => {
    mockWithFallbacks.mockImplementation(async (fn) =>
      fn({ getBlockHeight: async () => 300 } as never),
    );

    await expect(
      ensureTransactionValid({ blockhash: "abc", lastValidBlockHeight: 200 }),
    ).rejects.toMatchObject({
      code: "TRANSACTION_EXPIRED",
    });
  });
});

describe("signPredictionTransaction", () => {
  const FAKE_TX_BYTES = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const FAKE_BASE64 = btoa(String.fromCharCode(...FAKE_TX_BYTES));
  const TX_META = { blockhash: "abc", lastValidBlockHeight: 1000 };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWithFallbacks.mockImplementation(async (fn) =>
      fn({ getBlockHeight: async () => 100 } as never),
    );

    (VersionedTransaction.deserialize as jest.Mock).mockReturnValue({ serialize: () => FAKE_TX_BYTES });
  });

  it("signs and returns base64 signed transaction", async () => {
    const signFn = jest.fn<
      (tx: VersionedTransaction) => Promise<VersionedTransaction>
    >();
    signFn.mockResolvedValue({
      serialize: () => new Uint8Array([10, 20, 30]),
    } as never);

    const result = await signPredictionTransaction(
      signFn,
      FAKE_BASE64,
      TX_META,
    );

    expect(signFn).toHaveBeenCalledTimes(1);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("throws WALLET_APPROVAL_REJECTED on user rejection", async () => {
    const signFn = jest.fn<
      (tx: VersionedTransaction) => Promise<VersionedTransaction>
    >();
    signFn.mockRejectedValue(new Error("User rejected the request"));

    await expect(
      signPredictionTransaction(signFn, FAKE_BASE64, TX_META),
    ).rejects.toMatchObject({
      code: "WALLET_APPROVAL_REJECTED",
    });
  });

  it("throws TRANSACTION_SEND_FAILED on non-rejection sign errors", async () => {
    const signFn = jest.fn<
      (tx: VersionedTransaction) => Promise<VersionedTransaction>
    >();
    signFn.mockRejectedValue(new Error("Unknown MWA error"));

    await expect(
      signPredictionTransaction(signFn, FAKE_BASE64, TX_META),
    ).rejects.toMatchObject({
      code: "TRANSACTION_SEND_FAILED",
    });
  });

});
