import { useState } from "react";
import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePrivy } from "@privy-io/expo";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import LoginScreen from "@/components/auth/LoginScreen";
import ProfileView from "@/components/auth/ProfileView";
import WalletConnectSheet from "@/components/auth/WalletConnectSheet";

export default function ProfileScreen() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const themeColors = colors[theme];

  const { isReady, user } = usePrivy();
  const authenticated = !!user;

  const [walletSheetVisible, setWalletSheetVisible] = useState(false);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Profile
        </Text>

        {isReady && (
          authenticated ? (
            <ProfileView />
          ) : (
            <LoginScreen
              onConnectWallet={() => setWalletSheetVisible(true)}
            />
          )
        )}

        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: themeColors.textMuted }]}
          >
            APPEARANCE
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
              Dark Mode
            </Text>
            <Switch
              value={theme === "dark"}
              onValueChange={toggleTheme}
              trackColor={{
                false: themeColors.border,
                true: themeColors.accent,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: themeColors.textMuted }]}
          >
            ABOUT
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
              Version
            </Text>
            <Text
              style={[styles.rowValue, { color: themeColors.textMuted }]}
            >
              1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>

      <WalletConnectSheet
        visible={walletSheetVisible}
        onClose={() => setWalletSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display.regular,
    fontSize: fontSize.xxl,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
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
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.base,
  },
});
