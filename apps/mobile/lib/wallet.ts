import { VersionedTransaction } from "@solana/web3.js";
import { toUint8Array, fromUint8Array } from "@wallet-ui/react-native-web3js";
import { withSolanaConnectionFallbacks } from "@/lib/solana";

// --- Error types ---

export type WalletErrorCode =
  | "WALLET_APPROVAL_REJECTED"
  | "TRANSACTION_EXPIRED"
  | "TRANSACTION_SEND_FAILED";

const WALLET_ERROR_CODES = new Set<WalletErrorCode>([
  "WALLET_APPROVAL_REJECTED",
  "TRANSACTION_EXPIRED",
  "TRANSACTION_SEND_FAILED",
]);

export class WalletError extends Error {
  code: WalletErrorCode;

  constructor(
    code: WalletErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = "WalletError";
    this.code = code;
    if (options?.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        value: options.cause,
        enumerable: false,
        configurable: true,
      });
    }
  }
}

export function isWalletError(error: unknown): error is WalletError {
  if (error instanceof WalletError) return true;
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  return (
    typeof code === "string" &&
    WALLET_ERROR_CODES.has(code as WalletErrorCode)
  );
}

const ERROR_MESSAGES: Record<WalletErrorCode, string> = {
  WALLET_APPROVAL_REJECTED: "Transaction cancelled in wallet.",
  TRANSACTION_EXPIRED:
    "Transaction expired before approval. Try placing the bet again.",
  TRANSACTION_SEND_FAILED: "Transaction broadcast failed. Try again.",
};

export function walletError(
  code: WalletErrorCode,
  cause?: unknown,
): WalletError {
  return new WalletError(code, ERROR_MESSAGES[code], { cause });
}

// --- Error detection ---

const USER_REJECTION_PATTERN =
  /reject|declin|cancel|denied|dismiss|aborted|approval/i;
const TRANSACTION_EXPIRED_PATTERN =
  /blockhash|block height|expired|lastvalidblockheight/i;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isUserRejection(error: unknown): boolean {
  return USER_REJECTION_PATTERN.test(getErrorMessage(error));
}

export function isTransactionExpired(error: unknown): boolean {
  return TRANSACTION_EXPIRED_PATTERN.test(getErrorMessage(error));
}

// --- Transaction validation ---

export interface TransactionMeta {
  blockhash: string;
  lastValidBlockHeight: number;
}

export async function ensureTransactionValid(
  txMeta: TransactionMeta,
): Promise<void> {
  const currentBlockHeight = await withSolanaConnectionFallbacks((connection) =>
    connection.getBlockHeight("confirmed"),
  );
  if (currentBlockHeight > txMeta.lastValidBlockHeight) {
    throw walletError("TRANSACTION_EXPIRED");
  }
}

// --- Sign prediction transaction via SDK ---

export async function signPredictionTransaction(
  signFn: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
  base64Transaction: string,
  txMeta: TransactionMeta,
): Promise<string> {
  await ensureTransactionValid(txMeta);

  const txBytes = toUint8Array(base64Transaction);
  const transaction = VersionedTransaction.deserialize(txBytes);

  let signedTx: VersionedTransaction;
  try {
    signedTx = await signFn(transaction);
  } catch (error) {
    if (isUserRejection(error)) {
      throw walletError("WALLET_APPROVAL_REJECTED", error);
    }
    throw walletError("TRANSACTION_SEND_FAILED", error);
  }

  // Skip post-sign validation — the relay service checks block height during
  // confirmation polling.  Re-validating here forces an RPC call right after the
  // app returns from the wallet (background → foreground), when the network
  // stack is often not yet ready, causing spurious "network request failed".
  return fromUint8Array(signedTx.serialize());
}
