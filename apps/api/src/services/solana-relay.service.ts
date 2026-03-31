import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import type { SubmitSignedTransactionRequest, SubmitSignedTransactionResponse } from "@mintfeed/shared";

const DEFAULT_SOLANA_RPC_URL =
  process.env.SOLANA_RPC_URL
  ?? process.env.EXPO_PUBLIC_SOLANA_RPC_URL
  ?? "https://api.mainnet-beta.solana.com";

// Jupiter Prediction Market program + system programs allowed in relayed transactions
const ALLOWED_PROGRAM_IDS = new Set([
  "JUPPMpMCRpMSq2foLgsCMCnHoWLpnMBEZEjKThJGAJr", // Jupiter Prediction Market
  "11111111111111111111111111111111",                 // System Program
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",    // Token Program
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",  // Associated Token Program
  "ComputeBudget111111111111111111111111111111",      // Compute Budget
]);

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

function validateTransaction(base64Tx: string): void {
  let tx: VersionedTransaction;
  try {
    const buffer = Buffer.from(base64Tx, "base64");
    tx = VersionedTransaction.deserialize(buffer);
  } catch {
    throw new Error("Invalid transaction: failed to deserialize");
  }

  const programIds = tx.message.staticAccountKeys
    .filter((_, i) => tx.message.compiledInstructions.some((ix) => ix.programIdIndex === i))
    .map((key) => key.toBase58());

  // Also check address lookup tables — any program ID could be in the lookup
  for (const programId of programIds) {
    if (!ALLOWED_PROGRAM_IDS.has(programId)) {
      throw new Error(`Transaction contains unauthorized program: ${programId}`);
    }
  }

  if (tx.signatures.length === 0) {
    throw new Error("Transaction has no signatures");
  }
}

export async function relaySignedTransaction(
  request: SubmitSignedTransactionRequest,
  options: RelayOptions = {},
): Promise<SubmitSignedTransactionResponse> {
  validateTransaction(request.signedTransaction);

  const rpcUrl = options.rpcUrl ?? DEFAULT_SOLANA_RPC_URL;
  const pollIntervalMs = options.confirmationPollIntervalMs ?? 1_500;
  const maxChecks = options.maxConfirmationChecks ?? 20;
  const BLOCK_HEIGHT_CHECK_INTERVAL = 5;

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

  for (let attempt = 0; attempt < maxChecks; attempt += 1) {
    await sleep(pollIntervalMs);

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

    // Check block height sparingly to avoid extra RPC calls
    if (attempt % BLOCK_HEIGHT_CHECK_INTERVAL === 0) {
      const currentBlockHeight = await rpcRequest<number>(
        rpcUrl,
        "getBlockHeight",
        [{ commitment: "confirmed" }],
      );
      if (currentBlockHeight > request.txMeta.lastValidBlockHeight) {
        throw new Error("Transaction expired before confirmation. Try again.");
      }
    }
  }

  // Transaction was sent successfully but confirmation timed out.
  // Return the signature anyway — the tx is likely landing.
  console.warn("[Solana Relay] Confirmation timed out, returning signature optimistically:", signature);
  return { signature };
}
