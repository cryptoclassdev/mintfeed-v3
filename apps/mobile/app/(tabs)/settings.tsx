import { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Keyboard, Switch, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useAppStore, QUICK_BET_OPTIONS, QUICK_BET_MIN, QUICK_BET_MAX } from "@/lib/store";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useTradingStatus } from "@/hooks/usePredictionTrading";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import * as haptics from "@/lib/haptics";
import LoginScreen from "@/components/auth/LoginScreen";
import ProfileView from "@/components/auth/ProfileView";

export default function ProfileScreen() {
  const theme = useAppStore((s) => s.theme);
  const quickBetAmount = useAppStore((s) => s.quickBetAmount);
  const setQuickBetAmount = useAppStore((s) => s.setQuickBetAmount);
  const notificationPermission = useAppStore((s) => s.notificationPermission);
  const themeColors = colors[theme];
  const { account } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;
  const { preferences: notifPrefs, updatePreference } = useNotificationPreferences();
  const { data: tradingStatus } = useTradingStatus();
  const minimumQuickBetUsd = Math.max(
    QUICK_BET_MIN,
    tradingStatus?.minimum_order_usd ?? QUICK_BET_MIN,
  );

  const handleMarketMoversToggle = useCallback((v: boolean) => {
    haptics.selection();
    updatePreference({ marketMovers: v });
  }, [updatePreference]);

  const handleBreakingNewsToggle = useCallback((v: boolean) => {
    haptics.selection();
    updatePreference({ breakingNews: v });
  }, [updatePreference]);

  const handleSettlementsToggle = useCallback((v: boolean) => {
    haptics.selection();
    updatePreference({ predictionSettled: v });
  }, [updatePreference]);

  const isCustom = !(QUICK_BET_OPTIONS as readonly number[]).includes(quickBetAmount);
  const [isEditing, setIsEditing] = useState(false);
  const [customText, setCustomText] = useState(isCustom ? String(quickBetAmount) : "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const isSubmitting = useRef(false);

  useEffect(() => {
    if (quickBetAmount < minimumQuickBetUsd) {
      setQuickBetAmount(minimumQuickBetUsd);
    }
  }, [minimumQuickBetUsd, quickBetAmount, setQuickBetAmount]);

  const handlePresetChange = (amount: number) => {
    haptics.selection();
    setQuickBetAmount(amount);
    setIsEditing(false);
    setCustomText("");
    setValidationError(null);
    Keyboard.dismiss();
  };

  const handleCustomTap = () => {
    if (isEditing) return;
    haptics.selection();
    setIsEditing(true);
    setCustomText(isCustom ? String(quickBetAmount) : "");
    setValidationError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleCustomTextChange = (text: string) => {
    setCustomText(text.replace(/[^0-9]/g, ""));
    setValidationError(null);
  };

  const handleCustomSubmit = () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    // Reset flag after current event loop to prevent stale lock
    setTimeout(() => { isSubmitting.current = false; }, 0);

    const trimmed = customText.trim();
    if (trimmed === "") {
      setIsEditing(false);
      setValidationError(null);
      setCustomText(isCustom ? String(quickBetAmount) : "");
      Keyboard.dismiss();
      return;
    }

    const parsed = parseInt(trimmed, 10);

    if (isNaN(parsed) || parsed < minimumQuickBetUsd) {
      setValidationError(`Min $${minimumQuickBetUsd}`);
      haptics.warning();
      return;
    }

    if (parsed > QUICK_BET_MAX) {
      setValidationError(`Max $${QUICK_BET_MAX}`);
      haptics.warning();
      return;
    }

    setQuickBetAmount(parsed);
    setIsEditing(false);
    setValidationError(null);
    haptics.success();
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
          <Text style={[styles.sectionDescription, { color: themeColors.textFaint }]}>
            Current venue minimum: ${minimumQuickBetUsd}
          </Text>
          <View style={styles.quickBetRow}>
            {QUICK_BET_OPTIONS.map((amount) => {
              const selected = quickBetAmount === amount && !isCustom && !isEditing;
              return (
                <Pressable
                  key={amount}
                  onPress={() => handlePresetChange(amount)}
                  style={[
                    styles.quickBetChip,
                    {
                      backgroundColor: selected
                        ? themeColors.accentMint + "20"
                        : themeColors.card,
                      borderColor: selected
                        ? themeColors.accentMint
                        : themeColors.cardBorder,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Set quick bet to ${amount} dollars`}
                >
                  <Text
                    style={[
                      styles.quickBetText,
                      { color: selected ? themeColors.accentMint : themeColors.textMuted },
                    ]}
                  >
                    ${amount}
                  </Text>
                </Pressable>
              );
            })}
            {/* Custom chip — transforms into inline input when tapped */}
            <Pressable
              onPress={handleCustomTap}
              style={[
                styles.quickBetChip,
                {
                  backgroundColor: isCustom || isEditing
                    ? themeColors.accentMint + "20"
                    : themeColors.card,
                  borderColor: validationError
                    ? themeColors.negative
                    : isCustom || isEditing
                      ? themeColors.accentMint
                      : themeColors.cardBorder,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isCustom || isEditing }}
              accessibilityLabel="Set a custom bet amount"
            >
              {isEditing ? (
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.quickBetText,
                    { color: themeColors.accentMint, minWidth: 40, textAlign: "center", padding: 0 },
                  ]}
                  value={customText}
                  onChangeText={handleCustomTextChange}
                  onSubmitEditing={handleCustomSubmit}
                  onBlur={handleCustomSubmit}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  placeholder={`$${minimumQuickBetUsd}`}
                  placeholderTextColor={themeColors.textFaint}
                  maxLength={4}
                />
              ) : (
                <Text
                  style={[
                    styles.quickBetText,
                    { color: isCustom ? themeColors.accentMint : themeColors.textMuted },
                  ]}
                >
                  {isCustom ? `$${quickBetAmount}` : "Custom"}
                </Text>
              )}
            </Pressable>
          </View>
          {validationError && (
            <Text style={[styles.validationError, { color: themeColors.negative }]}>
              {validationError}
            </Text>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: themeColors.accent }]} />
            <Text
              style={[styles.sectionTitle, { color: themeColors.textSecondary }]}
            >
              NOTIFICATIONS
            </Text>
          </View>
          {notificationPermission === "denied" ? (
            <Pressable onPress={() => Linking.openSettings()}>
              <Text style={[styles.sectionDescription, { color: themeColors.negative }]}>
                Notifications are disabled. Tap to open settings.
              </Text>
            </Pressable>
          ) : (
            <>
              <View style={[styles.toggleRow, { borderColor: themeColors.cardBorder }]}>
                <View style={styles.toggleLabel}>
                  <Text style={[styles.toggleTitle, { color: themeColors.text }]}>Market Movers</Text>
                  <Text style={[styles.toggleSubtitle, { color: themeColors.textMuted }]}>
                    Price swings over 5% on major coins
                  </Text>
                </View>
                <Switch
                  value={notifPrefs.marketMovers}
                  onValueChange={handleMarketMoversToggle}
                  trackColor={{ false: themeColors.trackBg, true: themeColors.accentMint + "60" }}
                  thumbColor={notifPrefs.marketMovers ? themeColors.accentMint : themeColors.textMuted}
                />
              </View>
              <View style={[styles.toggleRow, { borderColor: themeColors.cardBorder }]}>
                <View style={styles.toggleLabel}>
                  <Text style={[styles.toggleTitle, { color: themeColors.text }]}>Breaking News</Text>
                  <Text style={[styles.toggleSubtitle, { color: themeColors.textMuted }]}>
                    Major regulatory and market events
                  </Text>
                </View>
                <Switch
                  value={notifPrefs.breakingNews}
                  onValueChange={handleBreakingNewsToggle}
                  trackColor={{ false: themeColors.trackBg, true: themeColors.accentMint + "60" }}
                  thumbColor={notifPrefs.breakingNews ? themeColors.accentMint : themeColors.textMuted}
                />
              </View>
              <View style={[styles.toggleRow, { borderColor: themeColors.cardBorder }]}>
                <View style={styles.toggleLabel}>
                  <Text style={[styles.toggleTitle, { color: themeColors.text }]}>Bet Settlements</Text>
                  <Text style={[styles.toggleSubtitle, { color: themeColors.textMuted }]}>
                    When your predictions resolve
                  </Text>
                </View>
                <Switch
                  value={notifPrefs.predictionSettled}
                  onValueChange={handleSettlementsToggle}
                  trackColor={{ false: themeColors.trackBg, true: themeColors.accentMint + "60" }}
                  thumbColor={notifPrefs.predictionSettled ? themeColors.accentMint : themeColors.textMuted}
                />
              </View>
            </>
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
  validationError: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    marginTop: 6,
    letterSpacing: letterSpacing.wide,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  toggleLabel: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontFamily: fonts.body.light,
    fontSize: fontSize.xs,
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
