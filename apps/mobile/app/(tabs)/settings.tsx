import { View, Text, Switch, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import LoginScreen from "@/components/auth/LoginScreen";
import ProfileView from "@/components/auth/ProfileView";

export default function ProfileScreen() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const themeColors = colors[theme];
  const walletAddress = useAppStore((s) => s.walletAddress);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Profile
        </Text>

        {walletAddress ? <ProfileView /> : <LoginScreen />}

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
              thumbColor={themeColors.text}
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
