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
    subtitle: "Pick a side, choose an amount, and approve from your wallet.",
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
          styles.signalCard,
          { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
        ]}
      >
        <View style={[styles.feedImage, { backgroundColor: "#12351F" }]} />
        <Text style={[styles.previewKicker, { color: accentColor }]}>CRYPTO</Text>
        <Text style={[styles.previewTitle, { color: themeColors.text }]}>
          Bitcoin volatility returns before market open
        </Text>
        <Text style={[styles.previewBody, { color: themeColors.textMuted }]}>
          Summary, source, and market context.
        </Text>
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
          styles.marketSheetPreview,
          {
            backgroundColor: themeColors.background,
            borderColor: themeColors.cardBorder,
          },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: themeColors.textFaint }]} />
        <Text style={[styles.sheetLabel, { color: themeColors.textMuted }]}>YOUR PICK</Text>
        <Text style={[styles.amountText, { color: themeColors.text }]}>$5.00</Text>
        <View style={[styles.approveButton, { backgroundColor: accentColor }]}>
          <Text style={styles.approveText}>REVIEW TRADE</Text>
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
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: `${accentColor}24` }]}>
          <Ionicons name="person" size={20} color={accentColor} />
        </View>
        <View style={styles.profileNameBlock}>
          <Text style={[styles.profileName, { color: themeColors.text }]}>Your profile</Text>
          <Text style={[styles.profileWallet, { color: themeColors.textMuted }]}>
            Wallet, positions, history
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.positionPreview,
          { backgroundColor: themeColors.background },
        ]}
      >
        <View style={styles.positionTopRow}>
          <Text style={[styles.previewKicker, { color: accentColor }]}>OPEN POSITION</Text>
          <Text style={[styles.pnlText, { color: themeColors.positive }]}>+$1.42</Text>
        </View>
        <Text style={[styles.previewTitle, { color: themeColors.text }]}>
          YES · SOL above $180
        </Text>
        <View style={[styles.profileBarTrack, { backgroundColor: themeColors.trackBg }]}>
          <View style={[styles.profileBarFill, { backgroundColor: themeColors.positive }]} />
        </View>
      </View>

      <View style={styles.historyRows}>
        <View style={[styles.historyLine, { backgroundColor: themeColors.border }]} />
        <View style={[styles.historyLineShort, { backgroundColor: themeColors.border }]} />
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
  signalCard: {
    borderRadius: 24,
    borderCurve: "continuous",
    borderWidth: 1,
    minHeight: 176,
    overflow: "hidden",
    padding: 14,
    position: "absolute",
    width: Math.min(SCREEN_WIDTH * 0.78, 300),
  },
  feedImage: {
    borderRadius: 18,
    borderCurve: "continuous",
    height: 62,
    marginBottom: 12,
  },
  previewKicker: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
    marginBottom: 6,
  },
  previewTitle: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize.base,
    lineHeight: 19,
  },
  previewBody: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    lineHeight: 16,
    marginTop: 8,
  },
  tradeCard: {
    borderRadius: 22,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 16,
    width: Math.min(SCREEN_WIDTH * 0.78, 300),
  },
  oddsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  yesPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
  },
  marketSheetPreview: {
    borderRadius: 24,
    borderCurve: "continuous",
    borderWidth: 1,
    padding: 14,
    width: Math.min(SCREEN_WIDTH * 0.74, 286),
  },
  sheetHandle: {
    alignSelf: "center",
    borderRadius: 999,
    height: 3,
    marginBottom: 12,
    width: 34,
  },
  sheetLabel: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wider,
  },
  amountText: {
    fontFamily: fonts.brand.extraBold,
    fontSize: 30,
    marginVertical: 6,
  },
  approveButton: {
    alignItems: "center",
    borderRadius: 12,
    borderCurve: "continuous",
    paddingVertical: 10,
  },
  approveText: {
    color: "#ffffff",
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
  },
  profilePreview: {
    borderRadius: 28,
    borderCurve: "continuous",
    borderWidth: 1,
    gap: 14,
    padding: 16,
    width: Math.min(SCREEN_WIDTH * 0.78, 300),
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  profileNameBlock: {
    flex: 1,
  },
  profileName: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize.base,
  },
  profileWallet: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
    marginTop: 2,
  },
  positionPreview: {
    borderRadius: 18,
    borderCurve: "continuous",
    padding: 12,
  },
  positionTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pnlText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.sm,
  },
  profileBarTrack: {
    borderRadius: 999,
    height: 5,
    marginTop: 12,
    overflow: "hidden",
  },
  profileBarFill: {
    borderRadius: 999,
    height: "100%",
    width: "68%",
  },
  historyRows: {
    gap: 8,
    paddingTop: 2,
  },
  historyLine: {
    borderRadius: 999,
    height: 6,
    opacity: 0.7,
    width: "92%",
  },
  historyLineShort: {
    borderRadius: 999,
    height: 6,
    opacity: 0.5,
    width: "62%",
  },
});
