import { Platform } from "react-native";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { VersionedTransaction } from "@solana/web3.js";
import { SOLANA_MWA_CHAIN, solanaConnection } from "@/lib/solana";

// Lazy-load MWA to avoid eager TurboModuleRegistry.getEnforcing crash on iOS
function getTransact() {
  if (Platform.OS !== "android") {
    throw new Error("MWA wallet connect is only available on Android");
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@solana-mobile/mobile-wallet-adapter-protocol-web3js")
    .transact as typeof import("@solana-mobile/mobile-wallet-adapter-protocol-web3js").transact;
}

const APP_IDENTITY = {
  name: "MintFeed",
  uri: "https://mintfeed.app",
} as const;

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
): Promise<{ signature: string; authToken: string }> {
  const transact = getTransact();

  const txBytes = Buffer.from(base64Transaction, "base64");
  const transaction = VersionedTransaction.deserialize(txBytes);

  const { signedTx, newAuthToken } = await transact(async (wallet) => {
    let token = authToken;
    try {
      const reauth = await wallet.reauthorize({
        auth_token: authToken,
        identity: APP_IDENTITY,
      });
      token = reauth.auth_token;
    } catch {
      const auth = await wallet.authorize({
        identity: APP_IDENTITY,
        chain: SOLANA_MWA_CHAIN,
      });
      token = auth.auth_token;
    }

    const signed = await wallet.signTransactions({
      transactions: [transaction],
    });

    return { signedTx: signed[0], newAuthToken: token };
  });

  const rawTransaction = signedTx.serialize();
  const txSignature = await solanaConnection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 3,
  });

  return { signature: txSignature, authToken: newAuthToken };
}

function base64ToBase58(base64Address: string): string {
  const bytes = Buffer.from(base64Address, "base64");
  return bs58.encode(bytes);
}
