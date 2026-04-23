import { PublicKey } from "@solana/web3.js";
import { withSolanaConnectionFallbacks } from "@/lib/solana";
import { USDC_MINT } from "@midnight/shared";

export interface WalletBalances {
  solLamports: number;
  usdcMicroAmount: number;
}

const USDC_MINT_PUBKEY = new PublicKey(USDC_MINT);

export async function fetchWalletBalances(pubkey: string): Promise<WalletBalances> {
  const owner = new PublicKey(pubkey);

  const [solLamports, tokenAccounts] = await withSolanaConnectionFallbacks(
    async (connection) => {
      const [sol, tokens] = await Promise.all([
        connection.getBalance(owner, "confirmed"),
        connection.getTokenAccountsByOwner(owner, { mint: USDC_MINT_PUBKEY }),
      ]);
      return [sol, tokens] as const;
    },
  );

  let usdcMicroAmount = 0;
  for (const { account } of tokenAccounts.value) {
    // USDC amount is stored as a u64 at bytes 64-72 of the token account data
    const data = account.data;
    if (data.length >= 72) {
      const amount = Number(data.readBigUInt64LE(64));
      usdcMicroAmount += amount;
    }
  }

  return { solLamports, usdcMicroAmount };
}

export function formatSolLamports(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  const decimals = sol < 0.01 ? 6 : 4;
  return sol.toFixed(decimals).replace(/\.?0+$/, "");
}

export function getUsdcBalanceError(
  balances: WalletBalances,
  tradeAmountMicro: number,
): string | null {
  if (balances.usdcMicroAmount < tradeAmountMicro) {
    const haveUsd = (balances.usdcMicroAmount / 1_000_000).toFixed(2);
    const needUsd = (tradeAmountMicro / 1_000_000).toFixed(2);
    return `Insufficient USDC. You have $${haveUsd} but need $${needUsd}.`;
  }
  return null;
}

export function getSolFeeBalanceError(
  balances: WalletBalances,
  requiredLamports: number,
): string | null {
  if (balances.solLamports >= requiredLamports) {
    return null;
  }

  return `Need about ${formatSolLamports(requiredLamports)} SOL for network fees. You have ${formatSolLamports(balances.solLamports)} SOL.`;
}

export const getBalanceError = getUsdcBalanceError;
