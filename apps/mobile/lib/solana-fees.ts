import { VersionedTransaction } from "@solana/web3.js";
import { toUint8Array } from "@wallet-ui/react-native-web3js";
import { withSolanaConnectionFallbacks } from "@/lib/solana";

export const DEFAULT_SOL_FEE_SAFETY_BUFFER_LAMPORTS = 5_000_000;
export const DEFAULT_SOL_FEE_FALLBACK_LAMPORTS = 5_000_000;

export interface SolFeeRequirement {
  feeLamports: number;
  bufferLamports: number;
  requiredLamports: number;
  source: "feeForMessage" | "fallback";
}

async function estimateTransactionFeeLamports(
  base64Transaction: string,
): Promise<{ feeLamports: number; source: SolFeeRequirement["source"] }> {
  try {
    const txBytes = toUint8Array(base64Transaction);
    const transaction = VersionedTransaction.deserialize(txBytes);
    const fee = await withSolanaConnectionFallbacks(async (connection) => {
      const response = await connection.getFeeForMessage(
        transaction.message,
        "confirmed",
      );
      return response.value;
    });

    if (typeof fee === "number" && Number.isFinite(fee)) {
      return { feeLamports: fee, source: "feeForMessage" };
    }
  } catch (error) {
    if (__DEV__) {
      console.warn("[solanaFees] Fee estimate failed:", error);
    }
  }

  return { feeLamports: 0, source: "fallback" };
}

export async function estimateSolRequirementForTransaction(
  base64Transaction: string,
  bufferLamports = DEFAULT_SOL_FEE_SAFETY_BUFFER_LAMPORTS,
): Promise<SolFeeRequirement> {
  const estimate = await estimateTransactionFeeLamports(base64Transaction);

  if (estimate.source === "fallback") {
    return {
      feeLamports: 0,
      bufferLamports: DEFAULT_SOL_FEE_FALLBACK_LAMPORTS,
      requiredLamports: DEFAULT_SOL_FEE_FALLBACK_LAMPORTS,
      source: "fallback",
    };
  }

  return {
    feeLamports: estimate.feeLamports,
    bufferLamports,
    requiredLamports: estimate.feeLamports + bufferLamports,
    source: "feeForMessage",
  };
}

export async function estimateSolRequirementForTransactions(
  base64Transactions: string[],
  bufferLamports = DEFAULT_SOL_FEE_SAFETY_BUFFER_LAMPORTS,
): Promise<SolFeeRequirement> {
  if (base64Transactions.length === 0) {
    return {
      feeLamports: 0,
      bufferLamports: 0,
      requiredLamports: 0,
      source: "feeForMessage",
    };
  }

  let totalFeeLamports = 0;

  for (const base64Transaction of base64Transactions) {
    const estimate = await estimateTransactionFeeLamports(base64Transaction);
    if (estimate.source === "fallback") {
      return {
        feeLamports: 0,
        bufferLamports: DEFAULT_SOL_FEE_FALLBACK_LAMPORTS,
        requiredLamports: DEFAULT_SOL_FEE_FALLBACK_LAMPORTS,
        source: "fallback",
      };
    }
    totalFeeLamports += estimate.feeLamports;
  }

  return {
    feeLamports: totalFeeLamports,
    bufferLamports,
    requiredLamports: totalFeeLamports + bufferLamports,
    source: "feeForMessage",
  };
}
