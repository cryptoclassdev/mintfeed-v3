import { Platform } from "react-native";
import bs58 from "bs58";
import { Buffer } from "buffer";
import { SOLANA_MWA_CHAIN } from "@/lib/solana";

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

const ED25519_SIGNATURE_LENGTH = 64;

/**
 * Authorize and sign a message in a single MWA session (one wallet round-trip).
 *
 * @param getMessageToSign - Called with the wallet address after authorize;
 *   returns the message bytes to sign (e.g. a SIWS payload).
 * @returns The wallet address and base58-encoded Ed25519 signature.
 */
export async function mwaAuthorizeAndSign(
  getMessageToSign: (address: string) => Promise<Uint8Array>
): Promise<{ address: string; signature: string }> {
  const transact = getTransact();
  return transact(async (wallet) => {
    const auth = await wallet.authorize({
      identity: APP_IDENTITY,
      chain: SOLANA_MWA_CHAIN,
    });

    const address = base64ToBase58(auth.accounts[0].address);

    const messageBytes = await getMessageToSign(address);

    const signedPayloads = await wallet.signMessages({
      addresses: [auth.accounts[0].address],
      payloads: [messageBytes],
    });

    const payload = signedPayloads[0];

    if (__DEV__) {
      console.log("[MWA] signed payload length:", payload.length);
      console.log("[MWA] message input length:", messageBytes.length);
    }

    // Extract the 64-byte Ed25519 signature from the signed payload.
    // If payload is exactly 64 bytes, it's just the signature (some wallets).
    // Otherwise, the signature is the last 64 bytes of the payload.
    const sigBytes =
      payload.length === ED25519_SIGNATURE_LENGTH
        ? payload
        : payload.slice(payload.length - ED25519_SIGNATURE_LENGTH);

    if (__DEV__) {
      console.log("[MWA] extracted sig length:", sigBytes.length);
    }

    const signature = bs58.encode(sigBytes);
    return { address, signature };
  });
}

function base64ToBase58(base64Address: string): string {
  const bytes = Buffer.from(base64Address, "base64");
  return bs58.encode(bytes);
}
