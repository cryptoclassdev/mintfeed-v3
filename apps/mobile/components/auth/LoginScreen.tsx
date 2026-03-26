import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { useAppStore } from "@/lib/store";
import { showToast } from "@/lib/toast";

export default function LoginScreen() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const { connect } = useMobileWallet();
  const [connecting, setConnecting] = useState(false);

  const isAndroid = Platform.OS === "android";

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
      showToast("success", "Wallet Connected", "Your wallet is now connected.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      if (!/user (rejected|cancelled)/i.test(msg)) {
        showToast("error", "Connection Failed", msg);
      }
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text
        style={[styles.heading, { color: themeColors.text }]}
        accessibilityRole="header"
      >
        Connect your wallet
      </Text>
      <Text style={[styles.subheading, { color: themeColors.textMuted }]}>
        Sign in with any Solana wallet app installed on your device.
      </Text>

      {isAndroid ? (
        <Pressable
          style={[styles.button, { backgroundColor: themeColors.accent }]}
          onPress={handleConnect}
          disabled={connecting}
          accessibilityRole="button"
          accessibilityLabel="Connect Solana wallet"
        >
          {connecting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.buttonText}>
            {connecting ? "Connecting..." : "Connect Wallet"}
          </Text>
        </Pressable>
      ) : (
        <Text
          style={[styles.unavailableText, { color: themeColors.textMuted }]}
        >
          Wallet connection is available on Android.
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
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
});
