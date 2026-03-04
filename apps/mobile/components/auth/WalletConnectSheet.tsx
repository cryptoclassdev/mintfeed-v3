import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLoginWithSiws } from "@privy-io/expo";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useAppStore } from "@/lib/store";
import { mwaConnect, mwaSignMessage } from "@/lib/wallet-adapter";

const SIWS_DOMAIN = "mintfeed.app";
const SIWS_URI = "https://mintfeed.app";

interface WalletConnectSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function WalletConnectSheet({
  visible,
  onClose,
}: WalletConnectSheetProps) {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];

  const { generateMessage, login } = useLoginWithSiws();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      // Step 1: MWA authorize — opens system wallet picker
      const address = await mwaConnect();

      // Step 2: Get SIWS message from Privy
      const { message } = await generateMessage({
        wallet: { address },
        from: { domain: SIWS_DOMAIN, uri: SIWS_URI },
      });

      // Step 3: Sign the message via MWA
      const messageBytes = new TextEncoder().encode(message);
      const { signature } = await mwaSignMessage(messageBytes);

      // Step 4: Authenticate with Privy
      await login({
        signature,
        message,
        wallet: { walletClientType: "mwa", connectorType: "mwa" },
      });

      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Wallet connection failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.handle} />
          <Text style={[styles.title, { color: themeColors.text }]}>
            Connect Wallet
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            Connect an external Solana wallet — Phantom, Backpack, Jupiter, and
            more.
          </Text>

          <Pressable
            style={[styles.connectButton, { backgroundColor: themeColors.accent }]}
            onPress={handleConnect}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            )}
          </Pressable>

          {error && (
            <Text style={[styles.errorText, { color: themeColors.negative }]}>
              {error}
            </Text>
          )}

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text
              style={[styles.cancelText, { color: themeColors.textMuted }]}
            >
              Close
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#555",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.display.regular,
    fontSize: fontSize.xl,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: 20,
  },
  connectButton: {
    padding: 14,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  connectButtonText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
    color: "#FFFFFF",
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginTop: 12,
    textAlign: "center",
  },
  cancelButton: {
    marginTop: 16,
    alignItems: "center",
    padding: 12,
  },
  cancelText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
  },
});
