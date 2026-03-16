import { useCallback, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from "react-native";
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
    image: require("@/assets/onboarding/logo-startup.png"),
    title: "midnight",
    subtitle: "Crypto & AI news.\nSwipe to explore.",
    accent: "accent" as const,
  },
  {
    image: require("@/assets/onboarding/swipe-up-icon.png"),
    title: "Swipe Up",
    subtitle: "Each card is a story.\nSwipe for the next one.",
    accent: "accent" as const,
  },
  {
    image: require("@/assets/onboarding/predict-icon.png"),
    title: "Predict",
    subtitle: "Bet on outcomes.\nTrade prediction markets.",
    accent: "accentMint" as const,
  },
];

const PAGE_COUNT = PAGES.length;

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
              <Animated.View
                entering={FadeIn.delay(200).duration(600)}
                style={styles.iconContainer}
              >
                <Image
                  source={page.image}
                  style={{ width: 120, height: 120, borderRadius: 20 }}
                  resizeMode="contain"
                />
              </Animated.View>

              {page.title.length > 0 && (
                <Animated.Text
                  entering={FadeInUp.delay(400).duration(500)}
                  style={[styles.title, { color: themeColors.text }]}
                >
                  {page.title}
                </Animated.Text>
              )}

              <Animated.View
                entering={FadeIn.delay(500).duration(400)}
                style={[
                  styles.accentLine,
                  { backgroundColor: themeColors.accent },
                ]}
              />

              <Animated.Text
                entering={FadeInDown.delay(600).duration(500)}
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
            {isLastPage ? "GET STARTED" : "NEXT"}
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
    paddingHorizontal: 40,
  },
  pageContent: {
    alignItems: "center",
    gap: 20,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 32,
    borderCurve: "continuous",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.brand.extraBold,
    fontSize: fontSize.xxxl,
    letterSpacing: letterSpacing.wider,
    textAlign: "center",
  },
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  subtitle: {
    fontFamily: fonts.brand.regular,
    fontSize: fontSize.lg,
    lineHeight: 28,
    textAlign: "center",
    maxWidth: SCREEN_WIDTH * 0.7,
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
});
