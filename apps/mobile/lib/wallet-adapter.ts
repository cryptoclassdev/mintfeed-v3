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

/**
 * Authorize via MWA in a single wallet round-trip.
 * Returns the wallet's base58 public key address.
 */
export async function mwaAuthorize(): Promise<string> {
  const transact = getTransact();
  return transact(async (wallet) => {
    const auth = await wallet.authorize({
      identity: APP_IDENTITY,
      chain: SOLANA_MWA_CHAIN,
    });
    return base64ToBase58(auth.accounts[0].address);
  });
}

function base64ToBase58(base64Address: string): string {
  const bytes = Buffer.from(base64Address, "base64");
  return bs58.encode(bytes);
}
