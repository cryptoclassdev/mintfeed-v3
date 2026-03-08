import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Platform } from "react-native";
import bs58 from "bs58";

const mockTransact = jest.fn();

jest.mock("@solana-mobile/mobile-wallet-adapter-protocol-web3js", () => ({
  transact: mockTransact,
}));

jest.mock("@solana/web3.js", () => {
  const mockDeserialize = jest.fn();
  return {
    __esModule: true,
    VersionedTransaction: {
      deserialize: mockDeserialize,
    },
    __mockDeserialize: mockDeserialize,
  };
});

jest.mock("@/lib/solana", () => {
  const mockPrimaryConnection = {
    getBlockHeight: jest.fn(),
    sendRawTransaction: jest.fn(),
    confirmTransaction: jest.fn(),
  };
  const mockFallbackConnection = {
    getBlockHeight: jest.fn(),
    sendRawTransaction: jest.fn(),
    confirmTransaction: jest.fn(),
  };
  const mockWithSolanaConnectionFallbacks = jest.fn(async (operation: (connection: typeof mockPrimaryConnection) => unknown) => {
    let lastError: unknown;
    for (const connection of [mockPrimaryConnection, mockFallbackConnection]) {
      try {
        return await operation(connection);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  });

  return {
    SOLANA_MWA_CHAIN: "solana:mainnet",
    solanaConnection: mockPrimaryConnection,
    withSolanaConnectionFallbacks: mockWithSolanaConnectionFallbacks,
    __mockSolanaConnection: mockPrimaryConnection,
    __mockFallbackSolanaConnection: mockFallbackConnection,
    __mockWithSolanaConnectionFallbacks: mockWithSolanaConnectionFallbacks,
  };
});

import {
  APP_IDENTITY,
  isWalletTransactionError,
  mwaSignTransaction,
  mwaSignAndSend,
} from "../wallet-adapter";

const { __mockDeserialize } = jest.requireMock("@solana/web3.js") as {
  __mockDeserialize: jest.Mock;
};
const { __mockSolanaConnection } = jest.requireMock("@/lib/solana") as {
  __mockSolanaConnection: {
    getBlockHeight: jest.Mock;
    sendRawTransaction: jest.Mock;
    confirmTransaction: jest.Mock;
  };
};
const { __mockFallbackSolanaConnection } = jest.requireMock("@/lib/solana") as {
  __mockFallbackSolanaConnection: {
    getBlockHeight: jest.Mock;
    sendRawTransaction: jest.Mock;
    confirmTransaction: jest.Mock;
  };
};
const mockGetBlockHeight = __mockSolanaConnection.getBlockHeight as jest.Mock;
const mockSendRawTransaction = __mockSolanaConnection.sendRawTransaction as jest.Mock;
const mockConfirmTransaction = __mockSolanaConnection.confirmTransaction as jest.Mock;
const mockFallbackGetBlockHeight = __mockFallbackSolanaConnection.getBlockHeight as jest.Mock;
const mockFallbackSendRawTransaction = __mockFallbackSolanaConnection.sendRawTransaction as jest.Mock;
const mockFallbackConfirmTransaction = __mockFallbackSolanaConnection.confirmTransaction as jest.Mock;

describe("wallet-adapter", () => {
  const fakeSignedTx = {
    serialize: jest.fn(() => new Uint8Array([7, 8, 9])),
  };
  const expectedAddress = bs58.encode(Buffer.from("wallet-1"));
  const fakeWallet = {
    reauthorize: jest.fn<() => Promise<{ auth_token: string; accounts: Array<{ address: string }> }>>(),
    authorize: jest.fn<() => Promise<{ auth_token: string; accounts: Array<{ address: string }> }>>(),
    signTransactions: jest.fn<() => Promise<Array<typeof fakeSignedTx>>>(),
  };
  const mockReauthorize = fakeWallet.reauthorize as any;
  const mockAuthorize = fakeWallet.authorize as any;
  const mockSignTransactions = fakeWallet.signTransactions as any;
  const mockTransactAny = mockTransact as any;
  const mockGetBlockHeightAny = mockGetBlockHeight as any;
  const mockSendRawTransactionAny = mockSendRawTransaction as any;
  const mockConfirmTransactionAny = mockConfirmTransaction as any;
  const mockFallbackGetBlockHeightAny = mockFallbackGetBlockHeight as any;
  const mockFallbackSendRawTransactionAny = mockFallbackSendRawTransaction as any;
  const mockFallbackConfirmTransactionAny = mockFallbackConfirmTransaction as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as { OS: string }).OS = "android";

    __mockDeserialize.mockReturnValue({ message: "tx" });
    mockGetBlockHeightAny.mockResolvedValue(10);
    mockSendRawTransactionAny.mockResolvedValue("sig-123");
    mockConfirmTransactionAny.mockResolvedValue({ value: { err: null } });
    mockFallbackGetBlockHeightAny.mockResolvedValue(10);
    mockFallbackSendRawTransactionAny.mockResolvedValue("sig-fallback");
    mockFallbackConfirmTransactionAny.mockResolvedValue({ value: { err: null } });

    mockReauthorize.mockResolvedValue({
      auth_token: "fresh-token",
      accounts: [{ address: Buffer.from("wallet-1").toString("base64") }],
    });
    mockAuthorize.mockResolvedValue({
      auth_token: "new-token",
      accounts: [{ address: Buffer.from("wallet-1").toString("base64") }],
    });
    mockSignTransactions.mockResolvedValue([fakeSignedTx]);
    mockTransactAny.mockImplementation(async (callback: any) => callback(fakeWallet));
  });

  it("exports the current Midnight identity", () => {
    expect(APP_IDENTITY).toEqual({
      name: "Midnight",
      uri: "https://thecommunication.link",
      icon: "/images/midnight.png",
    });
  });

  it("recognizes bridged wallet errors by code after they cross the native boundary", () => {
    const bridgedError = Object.assign(new Error("Transaction cancelled in wallet."), {
      code: "WALLET_APPROVAL_REJECTED",
      name: "SolanaMobileWalletAdapterError",
    });

    expect(isWalletTransactionError(bridgedError)).toBe(true);
  });

  it("throws WALLET_SESSION_EXPIRED when reauthorization fails", async () => {
    mockReauthorize.mockRejectedValueOnce(new Error("auth token invalid"));

    await expect(
      mwaSignAndSend(
        "dGVzdA==",
        "stale-token",
        { blockhash: "blockhash-1", lastValidBlockHeight: 50 },
        expectedAddress,
      ),
    ).rejects.toMatchObject({
      code: "WALLET_SESSION_EXPIRED",
    });
  });

  it("throws WALLET_ACCOUNT_MISMATCH when fallback authorize returns a different account", async () => {
    mockReauthorize.mockRejectedValueOnce(new Error("reauthorize failed"));
    mockAuthorize.mockResolvedValueOnce({
      auth_token: "new-token",
      accounts: [{ address: Buffer.from(new Uint8Array([99, 99, 99])).toString("base64") }],
    });

    await expect(
      mwaSignAndSend(
        "dGVzdA==",
        "stale-token",
        { blockhash: "blockhash-1", lastValidBlockHeight: 50 },
        expectedAddress,
      ),
    ).rejects.toMatchObject({
      code: "WALLET_ACCOUNT_MISMATCH",
    });
  });

  it("throws WALLET_APPROVAL_REJECTED when wallet signing is cancelled", async () => {
    mockSignTransactions.mockRejectedValueOnce(new Error("User rejected the request"));

    await expect(
      mwaSignAndSend(
        "dGVzdA==",
        "auth-token",
        { blockhash: "blockhash-1", lastValidBlockHeight: 50 },
        expectedAddress,
      ),
    ).rejects.toMatchObject({
      code: "WALLET_APPROVAL_REJECTED",
    });
  });

  it("throws TRANSACTION_EXPIRED before opening the wallet if the blockhash is already stale", async () => {
    mockGetBlockHeightAny.mockResolvedValueOnce(99);

    await expect(
      mwaSignAndSend(
        "dGVzdA==",
        "auth-token",
        { blockhash: "blockhash-1", lastValidBlockHeight: 50 },
        expectedAddress,
      ),
    ).rejects.toMatchObject({
      code: "TRANSACTION_EXPIRED",
    });
    expect(mockTransact).not.toHaveBeenCalled();
  });

  it("signs a transaction without broadcasting it from the device", async () => {
    await expect(
      mwaSignTransaction(
        "dGVzdA==",
        "auth-token",
        { blockhash: "blockhash-1", lastValidBlockHeight: 50 },
        expectedAddress,
      ),
    ).resolves.toEqual({
      signedTransaction: Buffer.from([7, 8, 9]).toString("base64"),
      authToken: "fresh-token",
    });

    expect(mockSignTransactions).toHaveBeenCalledTimes(1);
    expect(mockSendRawTransaction).not.toHaveBeenCalled();
    expect(mockConfirmTransaction).not.toHaveBeenCalled();
  });

  it("retries send and confirm on the fallback RPC after a network transport failure", async () => {
    mockSendRawTransactionAny.mockRejectedValueOnce(new TypeError("Network request failed"));

    await expect(
      mwaSignAndSend(
        "dGVzdA==",
        "auth-token",
        { blockhash: "blockhash-1", lastValidBlockHeight: 50 },
        expectedAddress,
      ),
    ).resolves.toEqual({
      signature: "sig-fallback",
      authToken: "fresh-token",
    });

    expect(mockSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockFallbackSendRawTransaction).toHaveBeenCalledTimes(1);
    expect(mockFallbackConfirmTransaction).toHaveBeenCalledTimes(1);
  });

  it("retries blockheight validation on the fallback RPC after a network transport failure", async () => {
    mockGetBlockHeightAny.mockRejectedValueOnce(new TypeError("Network request failed"));

    await expect(
      mwaSignAndSend(
        "dGVzdA==",
        "auth-token",
        { blockhash: "blockhash-1", lastValidBlockHeight: 50 },
        expectedAddress,
      ),
    ).resolves.toMatchObject({
      signature: "sig-123",
    });

    expect(mockGetBlockHeight).toHaveBeenCalled();
    expect(mockFallbackGetBlockHeight).toHaveBeenCalled();
  });
});
