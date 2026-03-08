import { Connection, clusterApiUrl } from "@solana/web3.js";
import type { AppIdentity, Chain } from "@solana-mobile/mobile-wallet-adapter-protocol";

export const SOLANA_CLUSTER = "mainnet-beta";
export const SOLANA_MWA_CHAIN: Chain = "solana:mainnet";

export const APP_IDENTITY: AppIdentity = {
  name: "Midnight",
  uri: "https://thecommunication.link",
  icon: "/images/midnight.png",
};
const DEFAULT_SOLANA_RPC_URL = clusterApiUrl(SOLANA_CLUSTER);

export const SOLANA_RPC_URL =
  process.env.EXPO_PUBLIC_SOLANA_RPC_URL
  ?? DEFAULT_SOLANA_RPC_URL;

export const SOLANA_RPC_URLS = Array.from(
  new Set([SOLANA_RPC_URL, DEFAULT_SOLANA_RPC_URL].filter(Boolean)),
);

export const solanaConnection = new Connection(
  SOLANA_RPC_URL,
  "confirmed"
);

export const solanaConnections = SOLANA_RPC_URLS.map(
  (rpcUrl) => new Connection(rpcUrl, "confirmed"),
);

function isRetryableTransportError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /network request failed|failed to fetch|networkerror/i.test(message);
}

export async function withSolanaConnectionFallbacks<T>(
  operation: (connection: Connection) => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let index = 0; index < solanaConnections.length; index += 1) {
    const connection = solanaConnections[index];

    try {
      return await operation(connection);
    } catch (error) {
      lastError = error;
      const hasNextConnection = index < solanaConnections.length - 1;
      if (!hasNextConnection || !isRetryableTransportError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
}

const ADDRESS_PREFIX_LENGTH = 4;
const ADDRESS_SUFFIX_LENGTH = 4;

export function formatSolanaAddress(address: string): string {
  if (address.length <= ADDRESS_PREFIX_LENGTH + ADDRESS_SUFFIX_LENGTH) {
    return address;
  }
  return `${address.slice(0, ADDRESS_PREFIX_LENGTH)}...${address.slice(-ADDRESS_SUFFIX_LENGTH)}`;
}
