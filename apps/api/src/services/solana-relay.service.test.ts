import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { relaySignedTransaction } from "./solana-relay.service";

describe("relaySignedTransaction", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("broadcasts and confirms a signed transaction over JSON-RPC", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: "sig-123",
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        result: {
          value: [
            {
              confirmationStatus: "confirmed",
              err: null,
            },
          ],
        },
      })));

    await expect(
      relaySignedTransaction(
        {
          signedTransaction: "c2lnbmVkLXR4",
          txMeta: {
            blockhash: "blockhash-1",
            lastValidBlockHeight: 50,
          },
        },
        {
          rpcUrl: "https://rpc.example.com",
          confirmationPollIntervalMs: 0,
          maxConfirmationChecks: 2,
        },
      ),
    ).resolves.toEqual({ signature: "sig-123" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://rpc.example.com");
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      method: "sendTransaction",
      params: [
        "c2lnbmVkLXR4",
        expect.objectContaining({
          encoding: "base64",
          preflightCommitment: "confirmed",
        }),
      ],
    });
  });
});
