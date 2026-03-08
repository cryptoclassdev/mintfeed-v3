import type { SubmitSignedTransactionRequest, SubmitSignedTransactionResponse } from "@mintfeed/shared";

const DEFAULT_SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL
  ?? process.env.EXPO_PUBLIC_SOLANA_RPC_URL
  ?? "https://api.mainnet-beta.solana.com";

type JsonRpcSuccess<T> = {
  jsonrpc: "2.0";
  id: number;
  result: T;
};

type JsonRpcFailure = {
  jsonrpc: "2.0";
  id: number;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
};

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcFailure;

type SignatureStatus = {
  confirmationStatus?: "processed" | "confirmed" | "finalized" | null;
  err: unknown;
} | null;

type RelayOptions = {
  rpcUrl?: string;
  confirmationPollIntervalMs?: number;
  maxConfirmationChecks?: number;
};

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function rpcRequest<T>(
  rpcUrl: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Solana RPC request failed with status ${response.status}`);
  }

  const body = await response.json() as JsonRpcResponse<T>;
  if ("error" in body) {
    throw new Error(body.error.message);
  }

  return body.result;
}

export async function relaySignedTransaction(
  request: SubmitSignedTransactionRequest,
  options: RelayOptions = {},
): Promise<SubmitSignedTransactionResponse> {
  const rpcUrl = options.rpcUrl ?? DEFAULT_SOLANA_RPC_URL;
  const confirmationPollIntervalMs = options.confirmationPollIntervalMs ?? 500;
  const maxConfirmationChecks = options.maxConfirmationChecks ?? 20;

  const signature = await rpcRequest<string>(
    rpcUrl,
    "sendTransaction",
    [
      request.signedTransaction,
      {
        encoding: "base64",
        preflightCommitment: "confirmed",
        maxRetries: 3,
      },
    ],
  );

  for (let attempt = 0; attempt < maxConfirmationChecks; attempt += 1) {
    const statusResult = await rpcRequest<{ value: SignatureStatus[] }>(
      rpcUrl,
      "getSignatureStatuses",
      [[signature]],
    );
    const status = statusResult.value[0];

    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (
      status?.confirmationStatus === "confirmed"
      || status?.confirmationStatus === "finalized"
    ) {
      return { signature };
    }

    const currentBlockHeight = await rpcRequest<number>(
      rpcUrl,
      "getBlockHeight",
      [{ commitment: "confirmed" }],
    );

    if (currentBlockHeight > request.txMeta.lastValidBlockHeight) {
      throw new Error("Transaction expired before confirmation. Try again.");
    }

    if (attempt < maxConfirmationChecks - 1) {
      await sleep(confirmationPollIntervalMs);
    }
  }

  throw new Error("Transaction confirmation timed out. Try again.");
}
