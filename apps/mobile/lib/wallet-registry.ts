/**
 * Known Solana wallet apps with MWA (Mobile Wallet Adapter) support.
 *
 * `scheme` — custom URI scheme used for detection via Linking.canOpenURL().
 * `packageName` — Android package used by WalletTargetModule to route
 *   the solana-wallet:// intent to a specific wallet app.
 */

import type { ImageSourcePropType } from "react-native";

export interface WalletInfo {
  id: string;
  name: string;
  icon: ImageSourcePropType;
  scheme: string;
  packageName: string | null;
}

export const WALLET_REGISTRY: WalletInfo[] = [
  {
    id: "phantom",
    name: "Phantom",
    icon: require("@/assets/wallet-logos/phantom.png"),
    scheme: "phantom://",
    packageName: "app.phantom",
  },
  {
    id: "solflare",
    name: "Solflare",
    icon: require("@/assets/wallet-logos/solflare.png"),
    scheme: "solflare://",
    packageName: "com.solflare.mobile",
  },
  {
    id: "backpack",
    name: "Backpack",
    icon: require("@/assets/wallet-logos/backpack.png"),
    scheme: "backpack://",
    packageName: "app.backpack",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    icon: require("@/assets/wallet-logos/backpack.png"),
    scheme: "ultimate://",
    packageName: "com.aspect.ultimate",
  },
];

/** Seeker's built-in wallet — detected via the generic MWA scheme */
export const SEEKER_WALLET: WalletInfo = {
  id: "seeker",
  name: "Seeker Wallet",
  icon: require("@/assets/wallet-logos/seeker.png"),
  scheme: "solana-wallet://",
  packageName: null, // Seed Vault responds to standard MWA intent — no targeting needed
};
