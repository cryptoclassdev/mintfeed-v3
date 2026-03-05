import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { useAppStore } from "@/lib/store";
import { mwaAuthorize } from "@/lib/wallet-adapter";

export default function LoginScreen() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const connectWallet = useAppStore((s) => s.connectWallet);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      const address = await mwaAuthorize();
      connectWallet(address);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Wallet connection failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const isAndroid = Platform.OS === "android";

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: themeColors.text }]}>
        Connect your wallet
      </Text>
      <Text style={[styles.subheading, { color: themeColors.textMuted }]}>
        Sign in with a Solana wallet — Phantom, Backpack, Jupiter, and more.
      </Text>

      {isAndroid ? (
        <Pressable
          style={[styles.button, { backgroundColor: themeColors.accent }]}
          onPress={handleConnect}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Connect Wallet</Text>
          )}
        </Pressable>
      ) : (
        <Text style={[styles.unavailableText, { color: themeColors.textMuted }]}>
          Wallet connection is available on Android.
        </Text>
      )}

      {error && (
        <Text style={[styles.errorText, { color: themeColors.negative }]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    fontFamily: fonts.display.regular,
    fontSize: fontSize.xxl,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    marginBottom: 24,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  buttonText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
    color: "#FFFFFF",
  },
  unavailableText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    paddingVertical: 14,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginTop: 12,
    textAlign: "center",
  },
});
