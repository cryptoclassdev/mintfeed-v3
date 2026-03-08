import { Platform } from "react-native";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { VersionedTransaction } from "@solana/web3.js";
import { SOLANA_MWA_CHAIN, withSolanaConnectionFallbacks } from "@/lib/solana";
import type { ClaimPositionResponse, CreateOrderResponse } from "@mintfeed/shared";

// Lazy-load MWA to avoid eager TurboModuleRegistry.getEnforcing crash on iOS
function getTransact() {
  if (Platform.OS !== "android") {
    throw new Error("MWA wallet connect is only available on Android");
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@solana-mobile/mobile-wallet-adapter-protocol-web3js")
    .transact as typeof import("@solana-mobile/mobile-wallet-adapter-protocol-web3js").transact;
}

export const APP_IDENTITY = {
  name: "Midnight",
  uri: "https://thecommunication.link",
  icon: "/images/midnight.png",
} as const;

export type WalletTransactionErrorCode =
  | "WALLET_SESSION_EXPIRED"
  | "WALLET_APPROVAL_REJECTED"
  | "WALLET_ACCOUNT_MISMATCH"
  | "TRANSACTION_EXPIRED"
  | "TRANSACTION_SEND_FAILED";

const WALLET_TRANSACTION_ERROR_CODES = new Set<WalletTransactionErrorCode>([
  "WALLET_SESSION_EXPIRED",
  "WALLET_APPROVAL_REJECTED",
  "WALLET_ACCOUNT_MISMATCH",
  "TRANSACTION_EXPIRED",
  "TRANSACTION_SEND_FAILED",
]);

type TransactionMeta = CreateOrderResponse["txMeta"] | ClaimPositionResponse["txMeta"];

const USER_REJECTION_PATTERN = /reject|declin|cancel|denied|dismiss|aborted|approval/i;
const TRANSACTION_EXPIRED_PATTERN = /blockhash|block height|expired|lastvalidblockheight/i;

export class WalletTransactionError extends Error {
  code: WalletTransactionErrorCode;

  constructor(code: WalletTransactionErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "WalletTransactionError";
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

export function isWalletTransactionError(error: unknown): error is WalletTransactionError {
  if (error instanceof WalletTransactionError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && WALLET_TRANSACTION_ERROR_CODES.has(code as WalletTransactionErrorCode);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isUserRejectionError(error: unknown): boolean {
  return USER_REJECTION_PATTERN.test(getErrorMessage(error));
}

function isTransactionExpiredError(error: unknown): boolean {
  return TRANSACTION_EXPIRED_PATTERN.test(getErrorMessage(error));
}

function buildWalletTransactionError(
  code: WalletTransactionErrorCode,
  cause?: unknown,
): WalletTransactionError {
  switch (code) {
    case "WALLET_SESSION_EXPIRED":
      return new WalletTransactionError(
        code,
        "Wallet session expired. Reconnect your wallet and try again.",
        { cause },
      );
    case "WALLET_APPROVAL_REJECTED":
      return new WalletTransactionError(
        code,
        "Transaction cancelled in wallet.",
        { cause },
      );
    case "WALLET_ACCOUNT_MISMATCH":
      return new WalletTransactionError(
        code,
        "Connected wallet changed. Reconnect your wallet and try again.",
        { cause },
      );
    case "TRANSACTION_EXPIRED":
      return new WalletTransactionError(
        code,
        "Transaction expired before approval. Try placing the bet again.",
        { cause },
      );
    case "TRANSACTION_SEND_FAILED":
      return new WalletTransactionError(
        code,
        "Transaction broadcast failed. Try again.",
        { cause },
      );
  }
}

async function ensureTransactionIsStillValid(txMeta: TransactionMeta): Promise<void> {
  const currentBlockHeight = await withSolanaConnectionFallbacks((connection) =>
    connection.getBlockHeight("confirmed")
  );
  if (currentBlockHeight > txMeta.lastValidBlockHeight) {
    throw buildWalletTransactionError("TRANSACTION_EXPIRED");
  }
}

function assertAuthorizedAccountMatches(
  base64Address: string | undefined,
  expectedAddress: string | undefined,
): void {
  if (!base64Address || !expectedAddress) return;
  const authorizedAddress = base64ToBase58(base64Address);
  if (authorizedAddress !== expectedAddress) {
    throw buildWalletTransactionError("WALLET_ACCOUNT_MISMATCH");
  }
}

async function signTransactionWithWallet(
  base64Transaction: string,
  authToken: string,
  expectedAddress?: string,
): Promise<{ signedTx: VersionedTransaction; newAuthToken: string }> {
  const transact = getTransact();

  const txBytes = Buffer.from(base64Transaction, "base64");
  const transaction = VersionedTransaction.deserialize(txBytes);

  return transact(async (wallet) => {
    let token = authToken;
    try {
      const reauth = await wallet.reauthorize({
        auth_token: authToken,
        identity: APP_IDENTITY,
      });
      assertAuthorizedAccountMatches(reauth.accounts?.[0]?.address, expectedAddress);
      token = reauth.auth_token;
    } catch (reauthError) {
      try {
        const auth = await wallet.authorize({
          identity: APP_IDENTITY,
          chain: SOLANA_MWA_CHAIN,
        });
        assertAuthorizedAccountMatches(auth.accounts?.[0]?.address, expectedAddress);
      } catch (authorizeError) {
        if (isWalletTransactionError(authorizeError)) {
          throw authorizeError;
        }
      }

      throw buildWalletTransactionError("WALLET_SESSION_EXPIRED", reauthError);
    }

    try {
      const signed = await wallet.signTransactions({
        transactions: [transaction],
      });
      return { signedTx: signed[0], newAuthToken: token };
    } catch (signError) {
      if (isUserRejectionError(signError)) {
        throw buildWalletTransactionError("WALLET_APPROVAL_REJECTED", signError);
      }
      throw buildWalletTransactionError("TRANSACTION_SEND_FAILED", signError);
    }
  });
}

/**
 * Authorize via MWA in a single wallet round-trip.
 * Returns the wallet's base58 public key address and auth_token for reauthorization.
 */
export async function mwaAuthorize(): Promise<{ address: string; authToken: string }> {
  const transact = getTransact();
  return transact(async (wallet) => {
    const auth = await wallet.authorize({
      identity: APP_IDENTITY,
      chain: SOLANA_MWA_CHAIN,
    });
    return {
      address: base64ToBase58(auth.accounts[0].address),
      authToken: auth.auth_token,
    };
  });
}

export async function mwaSignTransaction(
  base64Transaction: string,
  authToken: string,
  txMeta: TransactionMeta,
  expectedAddress?: string,
): Promise<{ signedTransaction: string; authToken: string }> {
  await ensureTransactionIsStillValid(txMeta);

  const { signedTx, newAuthToken } = await signTransactionWithWallet(
    base64Transaction,
    authToken,
    expectedAddress,
  );

  await ensureTransactionIsStillValid(txMeta);

  return {
    signedTransaction: Buffer.from(signedTx.serialize()).toString("base64"),
    authToken: newAuthToken,
  };
}

/**
 * Sign a transaction via MWA, then send it ourselves via RPC.
 *
 * Uses signTransactions (not signAndSendTransactions) because Phantom on
 * Android silently cancels MWA signAndSend sessions — the signing prompt
 * never appears and the session ends with CancellationException.
 *
 * Flow: reauthorize → signTransactions → sendRawTransaction (via our RPC).
 * Falls back to full authorize() if reauthorize fails (expired token).
 */
export async function mwaSignAndSend(
  base64Transaction: string,
  authToken: string,
  txMeta: TransactionMeta,
  expectedAddress?: string,
): Promise<{ signature: string; authToken: string }> {
  await ensureTransactionIsStillValid(txMeta);

  const { signedTx, newAuthToken } = await signTransactionWithWallet(
    base64Transaction,
    authToken,
    expectedAddress,
  );

  await ensureTransactionIsStillValid(txMeta);

  const rawTransaction = signedTx.serialize();
  try {
    const txSignature = await withSolanaConnectionFallbacks(async (connection) => {
      const signature = await connection.sendRawTransaction(rawTransaction, {
        maxRetries: 3,
      });

      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash: txMeta.blockhash,
          lastValidBlockHeight: txMeta.lastValidBlockHeight,
        },
        "confirmed",
      );

      if (confirmation.value.err) {
        throw new Error(JSON.stringify(confirmation.value.err));
      }

      return signature;
    });

    return { signature: txSignature, authToken: newAuthToken };
  } catch (sendOrConfirmError) {
    if (isTransactionExpiredError(sendOrConfirmError)) {
      throw buildWalletTransactionError("TRANSACTION_EXPIRED", sendOrConfirmError);
    }
    throw buildWalletTransactionError("TRANSACTION_SEND_FAILED", sendOrConfirmError);
  }
}

function base64ToBase58(base64Address: string): string {
  const bytes = Buffer.from(base64Address, "base64");
  return bs58.encode(bytes);
}
