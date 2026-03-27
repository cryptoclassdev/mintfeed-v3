import { useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useAppStore, QUICK_BET_OPTIONS, QUICK_BET_MIN } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import * as haptics from "@/lib/haptics";
import LoginScreen from "@/components/auth/LoginScreen";
import ProfileView from "@/components/auth/ProfileView";

export default function ProfileScreen() {
  const theme = useAppStore((s) => s.theme);
  const quickBetAmount = useAppStore((s) => s.quickBetAmount);
  const setQuickBetAmount = useAppStore((s) => s.setQuickBetAmount);
  const themeColors = colors[theme];
  const { account } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  const isPreset = (QUICK_BET_OPTIONS as readonly number[]).includes(quickBetAmount);
  const [showCustomInput, setShowCustomInput] = useState(!isPreset);
  const [customText, setCustomText] = useState(isPreset ? "" : String(quickBetAmount));
  const inputRef = useRef<TextInput>(null);

  const handlePresetChange = (amount: number) => {
    haptics.selection();
    setQuickBetAmount(amount);
    setShowCustomInput(false);
    setCustomText("");
    Keyboard.dismiss();
  };

  const handleCustomTap = () => {
    haptics.selection();
    setShowCustomInput(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCustomSubmit = () => {
    const parsed = parseInt(customText, 10);
    if (!isNaN(parsed) && parsed >= QUICK_BET_MIN) {
      setQuickBetAmount(parsed);
    } else {
      setCustomText(quickBetAmount >= QUICK_BET_MIN && !isPreset ? String(quickBetAmount) : "");
      if (isPreset) setShowCustomInput(false);
    }
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          Profile
        </Text>

        {walletAddress ? <ProfileView /> : <LoginScreen />}

        {/* Quick Bet Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: themeColors.accentMint }]} />
            <Text
              style={[styles.sectionTitle, { color: themeColors.textSecondary }]}
            >
              QUICK BET
            </Text>
          </View>
          <Text style={[styles.sectionDescription, { color: themeColors.textMuted }]}>
            Default amount when swiping to bet on predictions
          </Text>
          <View style={styles.quickBetRow}>
            {QUICK_BET_OPTIONS.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => handlePresetChange(amount)}
                style={[
                  styles.quickBetChip,
                  {
                    backgroundColor:
                      quickBetAmount === amount && !showCustomInput
                        ? themeColors.accentMint + "20"
                        : themeColors.card,
                    borderColor:
                      quickBetAmount === amount && !showCustomInput
                        ? themeColors.accentMint
                        : themeColors.cardBorder,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: quickBetAmount === amount && !showCustomInput }}
                accessibilityLabel={`Set quick bet to ${amount} dollars`}
              >
                <Text
                  style={[
                    styles.quickBetText,
                    {
                      color:
                        quickBetAmount === amount && !showCustomInput
                          ? themeColors.accentMint
                          : themeColors.textMuted,
                    },
                  ]}
                >
                  ${amount}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={handleCustomTap}
              style={[
                styles.quickBetChip,
                {
                  backgroundColor: showCustomInput
                    ? themeColors.accentMint + "20"
                    : themeColors.card,
                  borderColor: showCustomInput
                    ? themeColors.accentMint
                    : themeColors.cardBorder,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: showCustomInput }}
              accessibilityLabel="Set a custom bet amount"
            >
              <Text
                style={[
                  styles.quickBetText,
                  {
                    color: showCustomInput
                      ? themeColors.accentMint
                      : themeColors.textMuted,
                  },
                ]}
              >
                Custom
              </Text>
            </Pressable>
          </View>
          {showCustomInput && (
            <View style={[styles.customInputRow, { borderColor: themeColors.cardBorder }]}>
              <Text style={[styles.customInputPrefix, { color: themeColors.textMuted }]}>$</Text>
              <TextInput
                ref={inputRef}
                style={[
                  styles.customInput,
                  { color: themeColors.text, borderColor: themeColors.cardBorder, backgroundColor: themeColors.card },
                ]}
                value={customText}
                onChangeText={setCustomText}
                onSubmitEditing={handleCustomSubmit}
                onBlur={handleCustomSubmit}
                keyboardType="number-pad"
                returnKeyType="done"
                placeholder={`Min $${QUICK_BET_MIN}`}
                placeholderTextColor={themeColors.textFaint}
                maxLength={5}
              />
            </View>
          )}
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: themeColors.accentMint }]} />
            <Text
              style={[styles.sectionTitle, { color: themeColors.textSecondary }]}
            >
              ABOUT
            </Text>
          </View>
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
  scrollContent: {
    paddingBottom: 100,
  },
  title: {
    fontFamily: fonts.brand.extraBold,
    fontSize: fontSize.xxl,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
  },
  sectionTitle: {
    fontFamily: fonts.brand.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
    textTransform: "uppercase",
  },
  sectionDescription: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    marginBottom: 12,
  },
  quickBetRow: {
    flexDirection: "row",
    gap: 8,
  },
  quickBetChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    minHeight: 44,
  },
  quickBetText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.base,
    letterSpacing: letterSpacing.wide,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  customInputPrefix: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.lg,
  },
  customInput: {
    flex: 1,
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.base,
    letterSpacing: letterSpacing.wide,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
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
    fontFamily: fonts.brand.regular,
    fontSize: fontSize.base,
  },
  rowValue: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.base,
  },
});
