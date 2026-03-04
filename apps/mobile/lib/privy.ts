import type { PrivyConfig } from "@privy-io/expo";

export const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? "";
export const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ?? "";

export const privyConfig: PrivyConfig = {
  embedded: {
    solana: {
      createOnLogin: "all-users",
    },
  },
};
