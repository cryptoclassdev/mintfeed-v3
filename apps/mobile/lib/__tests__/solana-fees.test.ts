import { VersionedTransaction } from "@solana/web3.js";
import { toUint8Array } from "@wallet-ui/react-native-web3js";
import { withSolanaConnectionFallbacks } from "@/lib/solana";
import {
  DEFAULT_SOL_FEE_FALLBACK_LAMPORTS,
  estimateSolRequirementForTransaction,
  estimateSolRequirementForTransactions,
} from "../solana-fees";

jest.mock("@/lib/solana", () => ({
  withSolanaConnectionFallbacks: jest.fn(),
}));

const mockedDeserialize = VersionedTransaction.deserialize as jest.Mock;
const mockedToUint8Array = toUint8Array as jest.Mock;
const mockedWithSolanaConnectionFallbacks =
  withSolanaConnectionFallbacks as jest.Mock;

describe("solana fee estimates", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedToUint8Array.mockReturnValue(new Uint8Array([1, 2, 3]));
    mockedDeserialize.mockReturnValue({ message: { serialize: jest.fn() } });
  });

  it("estimates required SOL from transaction fee plus safety buffer", async () => {
    mockedWithSolanaConnectionFallbacks.mockImplementation(
      async (operation: (connection: unknown) => Promise<number>) =>
        operation({
          getFeeForMessage: jest.fn().mockResolvedValue({ value: 5_000 }),
        }),
    );

    await expect(
      estimateSolRequirementForTransaction("base64-tx"),
    ).resolves.toEqual({
      feeLamports: 5_000,
      bufferLamports: 5_000_000,
      requiredLamports: 5_005_000,
      source: "feeForMessage",
    });
  });

  it("falls back to 0.005 SOL when RPC fee estimation fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedWithSolanaConnectionFallbacks.mockRejectedValue(new Error("rate limited"));

    await expect(
      estimateSolRequirementForTransaction("base64-tx"),
    ).resolves.toEqual({
      feeLamports: 0,
      bufferLamports: DEFAULT_SOL_FEE_FALLBACK_LAMPORTS,
      requiredLamports: DEFAULT_SOL_FEE_FALLBACK_LAMPORTS,
      source: "fallback",
    });
    warnSpy.mockRestore();
  });

  it("sums transaction fees and applies one safety buffer for close-all", async () => {
    mockedWithSolanaConnectionFallbacks
      .mockImplementationOnce(
        async (operation: (connection: unknown) => Promise<number>) =>
          operation({
            getFeeForMessage: jest.fn().mockResolvedValue({ value: 5_000 }),
          }),
      )
      .mockImplementationOnce(
        async (operation: (connection: unknown) => Promise<number>) =>
          operation({
            getFeeForMessage: jest.fn().mockResolvedValue({ value: 6_000 }),
          }),
      );

    await expect(
      estimateSolRequirementForTransactions(["tx-1", "tx-2"]),
    ).resolves.toEqual({
      feeLamports: 11_000,
      bufferLamports: 5_000_000,
      requiredLamports: 5_011_000,
      source: "feeForMessage",
    });
  });

  it("does not require SOL when there are no transactions to send", async () => {
    await expect(estimateSolRequirementForTransactions([])).resolves.toEqual({
      feeLamports: 0,
      bufferLamports: 0,
      requiredLamports: 0,
      source: "feeForMessage",
    });
  });
});
