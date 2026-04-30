import { useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import * as haptics from "@/lib/haptics";
import PagerView from "react-native-pager-view";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PAGES = [
  {
    scene: "brand" as const,
    title: "Welcome to Midnight",
    subtitle: "Swipe the market. Catch the signal. Trade only when it matters.",
    accent: "accent" as const,
  },
  {
    scene: "signals" as const,
    title: "Swipe Through Live Signals",
    subtitle: "Fast news cards with the context you need, without the noise.",
    accent: "accent" as const,
  },
  {
    scene: "trade" as const,
    title: "Trade Predictions",
    subtitle: "Choose an amount, then approve from your wallet.",
    accent: "accentMint" as const,
  },
  {
    scene: "profile" as const,
    title: "Track Your Edge",
    subtitle: "See your open trades, history, and results in one place.",
    accent: "accentMint" as const,
  },
];

const PAGE_COUNT = PAGES.length;
type OnboardingScene = (typeof PAGES)[number]["scene"];

type SceneProps = {
  scene: OnboardingScene;
  accentColor: string;
  themeColors: (typeof colors)[keyof typeof colors];
};

function OnboardingScenePreview({
  scene,
  accentColor,
  themeColors,
}: SceneProps) {
  if (scene === "signals") {
    return (
      <SignalsPreview
        accentColor={accentColor}
        themeColors={themeColors}
      />
    );
  }
  if (scene === "trade") {
    return (
      <TradePreview
        accentColor={accentColor}
        themeColors={themeColors}
      />
    );
  }
  if (scene === "profile") {
    return (
      <ProfilePreview
        accentColor={accentColor}
        themeColors={themeColors}
      />
    );
  }
  return <BrandPreview themeColors={themeColors} />;
}

function BrandPreview({
  themeColors,
}: Pick<SceneProps, "themeColors">) {
  return (
    <View style={styles.brandPreview}>
      <Image
        source={require("@/assets/icon.png")}
        style={[styles.brandIcon, { borderColor: themeColors.cardBorder }]}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={[styles.brandWordmark, { color: themeColors.text }]}>
        Midnight
      </Text>
      <Text style={[styles.brandTagline, { color: themeColors.textMuted }]}>
        PREDICT THE NEXT MOVE
      </Text>
    </View>
  );
}

function SignalsPreview({
  accentColor,
  themeColors,
}: Omit<SceneProps, "scene">) {
  return (
    <View style={styles.previewStage}>
      <View
        style={[
          styles.feedPreview,
          { backgroundColor: themeColors.background },
        ]}
      >
        <View style={styles.feedFilterRow}>
          {["ALL", "CRYPTO", "AI"].map((label, index) => (
            <View
              key={label}
              style={[
                styles.feedFilterPill,
                {
                  backgroundColor: index === 0 ? themeColors.card : "transparent",
                  borderColor: index === 0 ? themeColors.accent : themeColors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.feedFilterText, { color: index === 0 ? themeColors.accent : themeColors.textMuted }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={[styles.feedHero, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
          <View style={[styles.feedHeroMark, { backgroundColor: accentColor }]} />
          <Text style={[styles.previewKicker, { color: accentColor }]}>CRYPTO</Text>
          <Text style={[styles.feedHeadline, { color: themeColors.text }]}>
            Bitcoin volatility returns before market open
          </Text>
          <Text style={[styles.feedMeta, { color: themeColors.textMuted }]}>
            THE DEFIANT · 13H AGO · READ FULL ARTICLE
          </Text>
          <View style={styles.feedSummaryLines}>
            <View style={[styles.feedSummaryLine, { backgroundColor: themeColors.textMuted }]} />
            <View style={[styles.feedSummaryLine, { backgroundColor: themeColors.textMuted, width: "84%" }]} />
            <View style={[styles.feedSummaryLine, { backgroundColor: themeColors.textMuted, width: "62%" }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function TradePreview({
  accentColor,
  themeColors,
}: Omit<SceneProps, "scene">) {
  return (
    <View style={styles.previewStage}>
      <View
        style={[
          styles.tradePreview,
          {
            backgroundColor: themeColors.background,
            borderColor: themeColors.cardBorder,
          },
        ]}
      >
        <View style={styles.tradeHeaderRow}>
          <Text style={[styles.tradeTitle, { color: themeColors.text }]}>Quick bet</Text>
          <Text style={[styles.tradeMinimum, { color: themeColors.textMuted }]}>MIN $10</Text>
        </View>
        <Text style={[styles.tradeHint, { color: themeColors.textMuted }]}>
          Default amount when swiping to bet
        </Text>
        <View style={styles.quickBetRow}>
          {[10, 25, 50, 100].map((amount, index) => (
            <View
              key={amount}
              style={[
                styles.quickBetPill,
                {
                  backgroundColor: index === 0 ? `${accentColor}18` : themeColors.card,
                  borderColor: index === 0 ? accentColor : themeColors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.quickBetText,
                  { color: index === 0 ? accentColor : themeColors.textMuted },
                ]}
              >
                ${amount}
              </Text>
            </View>
          ))}
        </View>
        <View style={[styles.walletButtonPreview, { backgroundColor: themeColors.accent }]}>
          <Ionicons name="wallet-outline" size={15} color="#ffffff" />
          <Text style={styles.walletButtonText}>APPROVE IN WALLET</Text>
        </View>
      </View>
    </View>
  );
}

function ProfilePreview({
  accentColor,
  themeColors,
}: Omit<SceneProps, "scene">) {
  return (
    <View
      style={[
        styles.profilePreview,
        { backgroundColor: themeColors.background, borderColor: themeColors.cardBorder },
      ]}
    >
      <Text style={[styles.profileScreenTitle, { color: themeColors.text }]}>Profile</Text>
      <Text style={[styles.profileConnectTitle, { color: themeColors.text }]}>
        Connect your wallet
      </Text>
      <Text style={[styles.profileConnectBody, { color: themeColors.textMuted }]}>
        Sign in with any Solana wallet app installed on your device.
      </Text>
      <View style={[styles.connectButtonPreview, { backgroundColor: themeColors.accent }]}>
        <Ionicons name="wallet-outline" size={15} color="#ffffff" />
        <Text style={styles.walletButtonText}>Connect Wallet</Text>
      </View>

      <View style={styles.profileSectionHeader}>
        <View style={[styles.sectionAccent, { backgroundColor: accentColor }]} />
        <Text style={[styles.profileSectionLabel, { color: themeColors.text }]}>QUICK BET</Text>
      </View>
      <Text style={[styles.profileSettingHint, { color: themeColors.textMuted }]}>
        Current venue minimum: $10
      </Text>
      <View style={styles.profileQuickBetRow}>
        {[10, 25, 50, 100].map((amount, index) => (
          <View
            key={amount}
            style={[
              styles.profileQuickBetPill,
              {
                backgroundColor: index === 0 ? `${accentColor}18` : themeColors.card,
                borderColor: index === 0 ? accentColor : themeColors.cardBorder,
              },
            ]}
          >
            <Text
              style={[
                styles.profileQuickBetText,
                { color: index === 0 ? accentColor : themeColors.textMuted },
              ]}
            >
              ${amount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function OnboardingFlow() {
  const theme = useAppStore((s) => s.theme);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const themeColors = colors[theme];
  const insets = useSafeAreaInsets();

  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const isLastPage = currentPage === PAGE_COUNT - 1;

  const handleNext = useCallback(() => {
    if (isLastPage) {
      haptics.heavyImpact(); // Completing onboarding — major action
      completeOnboarding();
    } else {
      haptics.lightImpact();
      pagerRef.current?.setPage(currentPage + 1);
    }
  }, [isLastPage, currentPage, completeOnboarding]);

  const handleSkip = useCallback(() => {
    haptics.lightImpact();
    completeOnboarding();
  }, [completeOnboarding]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Pressable
        onPress={handleSkip}
        style={[styles.skipButton, { top: insets.top + 12 }]}
        accessibilityRole="button"
        accessibilityLabel="Skip onboarding"
        hitSlop={12}
      >
        <Text style={[styles.skipText, { color: themeColors.textMuted }]}>
          SKIP
        </Text>
      </Pressable>

      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => { haptics.selection(); setCurrentPage(e.nativeEvent.position); }}
      >
        {PAGES.map((page, index) => (
          <View key={index} style={styles.page}>
            <View style={styles.pageContent}>
              <Animated.View entering={FadeIn.delay(160).duration(500)}>
                <OnboardingScenePreview
                  scene={page.scene}
                  accentColor={themeColors[page.accent]}
                  themeColors={themeColors}
                />
              </Animated.View>

              <Animated.Text
                entering={FadeInUp.delay(340).duration(500)}
                style={[styles.title, { color: themeColors.text }]}
              >
                {page.title}
              </Animated.Text>

              <Animated.Text
                entering={FadeInDown.delay(500).duration(500)}
                style={[styles.subtitle, { color: themeColors.textSecondary }]}
              >
                {page.subtitle}
              </Animated.Text>
            </View>
          </View>
        ))}
      </PagerView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>
          {PAGES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentPage
                      ? themeColors.accent
                      : themeColors.textFaint,
                  width: index === currentPage ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: themeColors.accent }]}
          accessibilityRole="button"
          accessibilityLabel={isLastPage ? "Get started" : "Next page"}
        >
          <Text style={styles.nextButtonText}>
            {isLastPage ? "START SWIPING" : "NEXT"}
          </Text>
          <Ionicons
            name={isLastPage ? "arrow-forward" : "chevron-forward"}
            size={18}
            color="#ffffff"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  pageContent: {
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontFamily: fonts.brand.extraBold,
    fontSize: 30,
    letterSpacing: letterSpacing.normal,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: Math.min(SCREEN_WIDTH * 0.82, 340),
  },
  footer: {
    paddingHorizontal: 24,
    gap: 24,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderCurve: "continuous",
  },
  nextButtonText: {
    fontFamily: fonts.brand.bold,
    fontSize: fontSize.sm,
    color: "#ffffff",
    letterSpacing: letterSpacing.wider,
  },
  brandPreview: {
    alignItems: "center",
    height: 238,
    justifyContent: "center",
    width: Math.min(SCREEN_WIDTH * 0.82, 340),
  },
  brandIcon: {
    borderRadius: 28,
    borderWidth: 1,
    height: 108,
    marginBottom: 20,
    width: 108,
  },
  brandWordmark: {
    fontFamily: fonts.brand.extraBold,
    fontSize: 46,
    letterSpacing: letterSpacing.tight,
  },
  brandTagline: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
    marginTop: 6,
  },
  previewStage: {
    alignItems: "center",
    height: 238,
    justifyContent: "center",
    width: Math.min(SCREEN_WIDTH * 0.82, 340),
  },
  feedPreview: {
    gap: 12,
    width: Math.min(SCREEN_WIDTH * 0.82, 330),
  },
  feedFilterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  feedFilterPill: {
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  feedFilterText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
  },
  feedHero: {
    borderRadius: 22,
    borderCurve: "continuous",
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
  },
  feedHeroMark: {
    borderRadius: 999,
    height: 4,
    marginBottom: 14,
    width: 46,
  },
  previewKicker: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
    marginBottom: 6,
  },
  feedHeadline: {
    fontFamily: fonts.body.bold,
    fontSize: 19,
    lineHeight: 23,
  },
  feedMeta: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
    marginTop: 12,
  },
  feedSummaryLines: {
    gap: 7,
    marginTop: 12,
  },
  feedSummaryLine: {
    borderRadius: 999,
    height: 5,
    opacity: 0.45,
    width: "100%",
  },
  tradePreview: {
    borderRadius: 28,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 18,
    width: Math.min(SCREEN_WIDTH * 0.82, 330),
  },
  tradeHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tradeTitle: {
    fontFamily: fonts.brand.extraBold,
    fontSize: 28,
  },
  tradeMinimum: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
  },
  tradeHint: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    marginTop: 6,
  },
  quickBetRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  quickBetPill: {
    alignItems: "center",
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  quickBetText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.sm,
  },
  walletButtonPreview: {
    alignItems: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
  },
  walletButtonText: {
    color: "#ffffff",
    fontFamily: fonts.body.bold,
    fontSize: fontSize.xs,
  },
  profilePreview: {
    borderRadius: 26,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 16,
    width: Math.min(SCREEN_WIDTH * 0.82, 330),
  },
  profileScreenTitle: {
    fontFamily: fonts.brand.extraBold,
    fontSize: 24,
    marginBottom: 14,
  },
  profileConnectTitle: {
    fontFamily: fonts.brand.extraBold,
    fontSize: 21,
  },
  profileConnectBody: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 6,
  },
  connectButtonPreview: {
    alignItems: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 12,
  },
  profileSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  sectionAccent: {
    borderRadius: 999,
    height: 22,
    width: 4,
  },
  profileSectionLabel: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
  },
  profileSettingHint: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    marginTop: 10,
  },
  profileQuickBetRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  profileQuickBetPill: {
    alignItems: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  profileQuickBetText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xs,
  },
});
