import { Connection, clusterApiUrl } from "@solana/web3.js";

const SOLANA_CLUSTER = __DEV__ ? "devnet" : "mainnet-beta";

export const solanaConnection = new Connection(
  clusterApiUrl(SOLANA_CLUSTER),
  "confirmed"
);

const ADDRESS_PREFIX_LENGTH = 4;
const ADDRESS_SUFFIX_LENGTH = 4;

export function formatSolanaAddress(address: string): string {
  if (address.length <= ADDRESS_PREFIX_LENGTH + ADDRESS_SUFFIX_LENGTH) {
    return address;
  }
  return `${address.slice(0, ADDRESS_PREFIX_LENGTH)}...${address.slice(-ADDRESS_SUFFIX_LENGTH)}`;
}
