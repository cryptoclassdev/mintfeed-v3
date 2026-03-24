import { useCallback } from "react";
import { NativeModules } from "react-native";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";

const WalletTarget = NativeModules.WalletTarget as {
  setTargetPackage: (packageName: string | null) => void;
} | null;

/**
 * Wraps `useMobileWallet().connect()` with Android-level wallet targeting.
 *
 * Before the MWA `solana-wallet://` intent fires, we tell our native
 * WalletTargetModule which package should receive it. MainActivity
 * intercepts the intent and calls `intent.setPackage(target)` so
 * Android routes to the correct wallet app.
 *
 * After the connection attempt (success or failure), the target is
 * cleared so subsequent MWA calls (signing, etc.) use normal routing.
 */
export function useTargetedConnect() {
  const { connect } = useMobileWallet();

  const connectToWallet = useCallback(
    async (packageName: string | null) => {
      try {
        if (packageName) {
          WalletTarget?.setTargetPackage(packageName);
        }
        return await connect();
      } finally {
        WalletTarget?.setTargetPackage(null);
      }
    },
    [connect],
  );

  return { connectToWallet };
}
