import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useAppStore } from "@/lib/store";
import { formatSolanaAddress } from "@/lib/solana";

export default function ProfileView() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const walletAddress = useAppStore((s) => s.walletAddress);
  const disconnectWallet = useAppStore((s) => s.disconnectWallet);

  const displayName = walletAddress
    ? formatSolanaAddress(walletAddress)
    : "User";

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: themeColors.text }]} accessibilityRole="header">
        Account
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>
          IDENTITY
        </Text>
        <View
          style={[
            styles.row,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.rowLabel, { color: themeColors.text }]}>
            Signed in as
          </Text>
          <Text style={[styles.rowValue, { color: themeColors.textSecondary }]}>
            {displayName}
          </Text>
        </View>
      </View>

      {walletAddress && (
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: themeColors.textMuted }]}
          >
            SOLANA WALLET
          </Text>
          <View
            style={[
              styles.row,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text style={[styles.rowLabel, { color: themeColors.text }]}>
              Address
            </Text>
            <Text style={[styles.walletAddress, { color: themeColors.accent }]}>
              {formatSolanaAddress(walletAddress)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Pressable
          style={[
            styles.signOutButton,
            {
              backgroundColor: themeColors.card,
              borderColor: themeColors.border,
            },
          ]}
          onPress={disconnectWallet}
          accessibilityRole="button"
          accessibilityLabel="Disconnect wallet"
        >
          <Text style={[styles.signOutText, { color: themeColors.negative }]}>
            Disconnect
          </Text>
        </Pressable>
      </View>
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
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 0.5,
  },
  rowLabel: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
  },
  rowValue: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    flexShrink: 1,
  },
  walletAddress: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.base,
  },
  signOutButton: {
    padding: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 0.5,
    alignItems: "center",
  },
  signOutText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
  },
});
