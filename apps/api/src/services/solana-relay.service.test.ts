import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock VersionedTransaction so validateTransaction passes with any base64
vi.mock("@solana/web3.js", () => {
  const mockMessage = {
    staticAccountKeys: [],
    compiledInstructions: [],
    addressTableLookups: [],
  };
  return {
    VersionedTransaction: {
      deserialize: () => ({ message: mockMessage, signatures: [new Uint8Array(64)] }),
    },
    PublicKey: class {
      constructor(public key: string) {}
      toBase58() { return this.key; }
    },
  };
});

import { relaySignedTransaction } from "./solana-relay.service";

// --- Helpers ---

let txCounter = 0;

/** Returns a unique base64 string per call to avoid dedup cache collisions between tests. */
function uniqueTx(): string {
  return Buffer.from(`tx-${++txCounter}-${Date.now()}`).toString("base64");
}

function rpcSuccess<T>(result: T) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }));
}

function rpcError(code: number, message: string) {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code, message } }));
}

function confirmedStatus() {
  return rpcSuccess({ value: [{ confirmationStatus: "confirmed", err: null }] });
}

function finalizedStatus() {
  return rpcSuccess({ value: [{ confirmationStatus: "finalized", err: null }] });
}

function pendingStatus() {
  return rpcSuccess({ value: [null] });
}

function failedStatus(err: unknown) {
  return rpcSuccess({ value: [{ confirmationStatus: "confirmed", err }] });
}

function blockHeight(height: number) {
  return rpcSuccess(height);
}

const RPC_URL = "https://rpc.test.com";
const BASE_OPTIONS = { rpcUrl: RPC_URL, confirmationPollIntervalMs: 0, maxConfirmationChecks: 2 };

function makeRequest(tx?: string) {
  return {
    signedTransaction: tx ?? uniqueTx(),
    txMeta: { blockhash: "blockhash-1", lastValidBlockHeight: 999999 },
  };
}

// --- Tests ---

describe("relaySignedTransaction", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // === Confirmation Polling ===

  describe("confirmation polling", () => {
    it("returns confirmed when getSignatureStatuses reports confirmed", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-abc"))
        .mockResolvedValueOnce(confirmedStatus());

      const result = await relaySignedTransaction(makeRequest(), BASE_OPTIONS);

      expect(result).toEqual({ signature: "sig-abc", status: "confirmed" });
    });

    it("returns confirmed when getSignatureStatuses reports finalized", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-fin"))
        .mockResolvedValueOnce(finalizedStatus());

      const result = await relaySignedTransaction(makeRequest(), BASE_OPTIONS);

      expect(result).toEqual({ signature: "sig-fin", status: "confirmed" });
    });

    it("throws when getSignatureStatuses reports an on-chain error", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-fail"))
        .mockResolvedValueOnce(failedStatus({ InstructionError: [0, "Custom"] }));

      await expect(relaySignedTransaction(makeRequest(), BASE_OPTIONS))
        .rejects.toThrow("Transaction failed");
    });

    it("returns pending after max polling attempts exhausted", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-pending")) // sendTransaction
        .mockResolvedValueOnce(pendingStatus())            // attempt 0: getSignatureStatuses
        .mockResolvedValueOnce(blockHeight(100))           // attempt 0: getBlockHeight (every 5th, 0%5=0)
        .mockResolvedValueOnce(pendingStatus());           // attempt 1: getSignatureStatuses

      const result = await relaySignedTransaction(makeRequest(), BASE_OPTIONS);

      expect(result).toEqual({ signature: "sig-pending", status: "pending" });
    });

    it("polls multiple times before confirming", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-slow"))
        .mockResolvedValueOnce(pendingStatus())
        .mockResolvedValueOnce(blockHeight(100))
        .mockResolvedValueOnce(confirmedStatus());

      const result = await relaySignedTransaction(makeRequest(), {
        ...BASE_OPTIONS,
        maxConfirmationChecks: 3,
      });

      expect(result.status).toBe("confirmed");
    });
  });

  // === Block Height Expiry ===

  describe("block height expiry", () => {
    it("throws expired when block height exceeds lastValidBlockHeight", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-exp"))
        .mockResolvedValueOnce(pendingStatus())
        .mockResolvedValueOnce(blockHeight(1000000));

      await expect(
        relaySignedTransaction(makeRequest(), { ...BASE_OPTIONS, maxConfirmationChecks: 5 }),
      ).rejects.toThrow("Transaction expired");
    });

    it("does not throw when block height is within range", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-ok"))
        .mockResolvedValueOnce(pendingStatus())
        .mockResolvedValueOnce(blockHeight(999998))
        .mockResolvedValueOnce(confirmedStatus());

      const result = await relaySignedTransaction(makeRequest(), {
        ...BASE_OPTIONS,
        maxConfirmationChecks: 3,
      });

      expect(result.status).toBe("confirmed");
    });
  });

  // === RPC Timeout (GAP 2) ===

  describe("RPC timeout", () => {
    it("passes AbortSignal to fetch calls", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-t"))
        .mockResolvedValueOnce(confirmedStatus());

      await relaySignedTransaction(makeRequest(), BASE_OPTIONS);

      // All fetch calls should have a signal
      for (const call of fetchMock.mock.calls) {
        expect(call[1]?.signal).toBeDefined();
      }
    });
  });

  // === sendTransaction Errors ===

  describe("sendTransaction errors", () => {
    it("throws when sendTransaction RPC returns JSON-RPC error", async () => {
      fetchMock.mockResolvedValueOnce(rpcError(-32000, "Blockhash not found"));

      await expect(relaySignedTransaction(makeRequest(), BASE_OPTIONS))
        .rejects.toThrow("Blockhash not found");
    });

    it("throws when sendTransaction HTTP response is 503", async () => {
      fetchMock.mockResolvedValueOnce(new Response("", { status: 503 }));

      await expect(relaySignedTransaction(makeRequest(), BASE_OPTIONS))
        .rejects.toThrow("status 503");
    });
  });

  // === Idempotency (GAP 3) ===

  describe("idempotency", () => {
    it("returns same promise for duplicate concurrent submissions", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-dedup"))
        .mockResolvedValueOnce(confirmedStatus());

      const sharedTx = uniqueTx();
      const req1 = makeRequest(sharedTx);
      const req2 = makeRequest(sharedTx);

      const promise1 = relaySignedTransaction(req1, BASE_OPTIONS);
      const promise2 = relaySignedTransaction(req2, BASE_OPTIONS);

      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1.signature).toBe("sig-dedup");
      expect(result2.signature).toBe("sig-dedup");

      // sendTransaction called only once
      const sendCalls = fetchMock.mock.calls.filter((call) => {
        const body = JSON.parse(String(call[1]?.body));
        return body.method === "sendTransaction";
      });
      expect(sendCalls).toHaveLength(1);
    });

    it("clears cache on failure so retry works", async () => {
      const sharedTx = uniqueTx();

      fetchMock.mockResolvedValueOnce(rpcError(-32000, "Blockhash not found"));
      await expect(relaySignedTransaction(makeRequest(sharedTx), BASE_OPTIONS)).rejects.toThrow();

      // Wait for .catch cleanup
      await new Promise((r) => setTimeout(r, 10));

      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-retry"))
        .mockResolvedValueOnce(confirmedStatus());

      const result = await relaySignedTransaction(makeRequest(sharedTx), BASE_OPTIONS);
      expect(result.signature).toBe("sig-retry");
    });

    it("different transactions are not deduplicated", async () => {
      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-a"))
        .mockResolvedValueOnce(confirmedStatus());

      const resultA = await relaySignedTransaction(makeRequest(), BASE_OPTIONS);

      fetchMock
        .mockResolvedValueOnce(rpcSuccess("sig-b"))
        .mockResolvedValueOnce(confirmedStatus());

      const resultB = await relaySignedTransaction(makeRequest(), BASE_OPTIONS);

      expect(resultA.signature).toBe("sig-a");
      expect(resultB.signature).toBe("sig-b");
    });
  });
});
