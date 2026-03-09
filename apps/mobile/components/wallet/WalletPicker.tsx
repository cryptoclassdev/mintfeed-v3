import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useWalletDiscovery } from "@/hooks/useWalletDiscovery";
import { useTargetedConnect } from "@/hooks/useTargetedConnect";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { showToast } from "@/lib/toast";
import type { WalletInfo } from "@/lib/wallet-registry";

interface WalletPickerProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

/**
 * Bottom-sheet wallet picker. Detects installed Solana wallets and
 * connects via MWA, targeting the selected wallet at the Android
 * intent level so the correct app opens.
 */
export function WalletPicker({ visible, onClose, onConnected }: WalletPickerProps) {
  const theme = useAppStore((s) => s.theme);
  const setPreferredWallet = useAppStore((s) => s.setPreferredWallet);
  const themeColors = colors[theme];
  const { installedWallets, loading } = useWalletDiscovery();
  const { connectToWallet } = useTargetedConnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = useCallback(
    async (wallet: WalletInfo) => {
      setConnectingId(wallet.id);
      try {
        await connectToWallet(wallet.packageName);
        setPreferredWallet(wallet.id);
        showToast("success", "Wallet Connected", `Connected via ${wallet.name}`);
        onClose();
        onConnected?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        if (!/user (rejected|cancelled)/i.test(msg)) {
          showToast("error", "Connection Failed", msg);
        }
      } finally {
        setConnectingId(null);
      }
    },
    [connectToWallet, onClose, onConnected, setPreferredWallet],
  );

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
              borderColor: themeColors.cardBorder,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: themeColors.textFaint }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Connect Wallet
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={themeColors.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            {installedWallets.length > 0
              ? "Detected wallets on this device"
              : "Connect with any Solana wallet"}
          </Text>

          {/* Wallet list */}
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={themeColors.accent} />
              <Text style={[styles.loadingText, { color: themeColors.textMuted }]}>
                Detecting wallets...
              </Text>
            </View>
          ) : (
            <View style={styles.walletList}>
              {installedWallets.map((wallet) => {
                const isConnecting = connectingId === wallet.id;
                return (
                  <Pressable
                    key={wallet.id}
                    style={[
                      styles.walletRow,
                      {
                        backgroundColor: themeColors.background,
                        borderColor: isConnecting
                          ? themeColors.accentMint
                          : themeColors.border,
                      },
                    ]}
                    onPress={() => handleConnect(wallet)}
                    disabled={connectingId !== null}
                  >
                    <Image source={wallet.icon} style={styles.walletIcon} />
                    <Text style={[styles.walletName, { color: themeColors.text }]}>
                      {wallet.name}
                    </Text>
                    {isConnecting ? (
                      <ActivityIndicator size="small" color={themeColors.accentMint} />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={themeColors.textFaint}
                      />
                    )}
                  </Pressable>
                );
              })}

              {installedWallets.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={24}
                    color={themeColors.textFaint}
                  />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                    No Solana wallets detected. Install a wallet like Phantom
                    or Solflare to continue.
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.brand.bold,
    fontSize: fontSize.xl,
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: 20,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 24,
  },
  loadingText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
  walletList: {
    gap: 8,
  },
  walletRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 12,
  },
  walletIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  walletName: {
    flex: 1,
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
});
