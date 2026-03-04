import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import bs58 from "bs58";
import { Buffer } from "buffer";

const APP_IDENTITY = {
  name: "MintFeed",
  uri: "https://mintfeed.app",
} as const;

const SOLANA_MAINNET_CHAIN = "solana:mainnet";

/**
 * Connect to a Solana wallet via MWA.
 * Opens the system wallet selector and returns the base58-encoded public key.
 */
export async function mwaConnect(): Promise<string> {
  const result = await transact(async (wallet) => {
    const auth = await wallet.authorize({
      identity: APP_IDENTITY,
      chain: SOLANA_MAINNET_CHAIN,
    });
    return auth.accounts[0].address;
  });
  return base64ToBase58(result);
}

/**
 * Connect + sign an arbitrary message via MWA.
 * Returns the base58-encoded signature.
 */
export async function mwaSignMessage(
  message: Uint8Array
): Promise<{ address: string; signature: string }> {
  return transact(async (wallet) => {
    const auth = await wallet.authorize({
      identity: APP_IDENTITY,
      chain: SOLANA_MAINNET_CHAIN,
    });

    const address = base64ToBase58(auth.accounts[0].address);

    const signatures = await wallet.signMessages({
      addresses: [auth.accounts[0].address],
      payloads: [message],
    });

    const signature = bs58.encode(signatures[0]);
    return { address, signature };
  });
}

function base64ToBase58(base64Address: string): string {
  const bytes = Buffer.from(base64Address, "base64");
  return bs58.encode(bytes);
}
