import React, { memo, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  runOnJS,
  Extrapolation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useLiveMarketPrice } from "@/hooks/useLiveMarketPrice";
import { formatCompactVolume, formatCompactDate } from "@mintfeed/shared";
import * as haptics from "@/lib/haptics";
import type { PredictionMarket } from "@mintfeed/shared";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/** Minimum horizontal drag before swipe-to-bet activates */
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
/** Distance at which the card fully commits */
const SWIPE_COMMIT = SCREEN_WIDTH * 0.45;
/** Minimum vertical movement that cancels a horizontal swipe (prevents conflict with PagerView) */
const VERTICAL_CANCEL = 20;

const SPRING_CONFIG = { damping: 20, stiffness: 300 };

function parsePrices(raw: unknown): Record<string, number> {
  if (!raw) return {};
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    result[k] = typeof v === "number" ? v : parseFloat(String(v)) || 0;
  }
  return result;
}

interface SwipeBetCardProps {
  market: PredictionMarket;
  onSwipeBet: (marketId: string, side: "yes" | "no") => void;
  walletConnected: boolean;
}

export const SwipeBetCard = memo(function SwipeBetCard({
  market,
  onSwipeBet,
  walletConnected,
}: SwipeBetCardProps) {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const quickBetAmount = useAppStore((s) => s.quickBetAmount);
  const themeColors = colors[theme];
  const { data: livePrices } = useLiveMarketPrice(market.id);
  const hasTriggeredHaptic = useRef(false);

  const prices = parsePrices(
    livePrices && Object.keys(livePrices).length > 0
      ? livePrices
      : market.outcomePrices,
  );

  const hasYesNo = "Yes" in prices && "No" in prices;
  if (!hasYesNo) return null;

  const yesPrice = prices["Yes"] ?? 0;
  const noPrice = prices["No"] ?? 0;
  const yesPercent = Math.round(yesPrice * 100);
  const isResolved = yesPrice >= 0.99 || noPrice >= 0.99;

  const parts: string[] = [];
  const dateStr = formatCompactDate(market.endDate);
  if (dateStr) parts.push(dateStr);
  const volStr = formatCompactVolume(market.volume ?? 0);
  if (volStr) parts.push(volStr);
  const metaText = parts.join(" \u00B7 ") || null;

  // Animation values
  const translateX = useSharedValue(0);
  const cardScale = useSharedValue(1);

  const triggerHapticAtThreshold = useCallback(() => {
    if (!hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      haptics.mediumImpact();
    }
  }, []);

  const resetHapticFlag = useCallback(() => {
    hasTriggeredHaptic.current = false;
  }, []);

  const handleSwipeBet = useCallback(
    (side: "yes" | "no") => {
      if (!walletConnected) {
        haptics.warning();
        return;
      }
      haptics.heavyImpact();
      onSwipeBet(market.id, side);
    },
    [walletConnected, market.id, onSwipeBet],
  );

  const openMarketSheet = useCallback(() => {
    haptics.lightImpact();
    router.push({
      pathname: `/market-sheet/${market.id}`,
      params: { question: market.question },
    });
  }, [router, market.id, market.question]);

  // Gesture: Pan horizontal for swipe-to-bet
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15]) // Activate after 15px horizontal movement
    .failOffsetY([-VERTICAL_CANCEL, VERTICAL_CANCEL]) // Cancel if vertical > threshold
    .onUpdate((e) => {
      translateX.value = e.translationX;

      // Trigger haptic when crossing threshold
      const absX = Math.abs(e.translationX);
      if (absX >= SWIPE_THRESHOLD && !hasTriggeredHaptic.current) {
        runOnJS(triggerHapticAtThreshold)();
      } else if (absX < SWIPE_THRESHOLD && hasTriggeredHaptic.current) {
        runOnJS(resetHapticFlag)();
      }
    })
    .onEnd((e) => {
      runOnJS(resetHapticFlag)();

      if (isResolved) {
        // Don't allow swipe-to-bet on resolved markets
        translateX.value = withSpring(0, SPRING_CONFIG);
        return;
      }

      const absX = Math.abs(e.translationX);

      if (absX >= SWIPE_THRESHOLD) {
        // Commit the swipe
        const side = e.translationX > 0 ? "yes" : "no";
        const target = e.translationX > 0 ? SWIPE_COMMIT : -SWIPE_COMMIT;

        translateX.value = withTiming(target, { duration: 200 }, () => {
          translateX.value = withSpring(0, SPRING_CONFIG);
        });
        cardScale.value = withSpring(0.95, SPRING_CONFIG, () => {
          cardScale.value = withSpring(1, SPRING_CONFIG);
        });

        runOnJS(handleSwipeBet)(side);
      } else {
        // Spring back
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  // Tap gesture for opening market sheet
  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(openMarketSheet)();
  });

  // Compose gestures: pan takes priority, tap is fallback
  const composedGesture = Gesture.Race(panGesture, tapGesture);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: cardScale.value },
    ],
  }));

  // YES reveal background (right swipe)
  const yesRevealStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0, 0.3, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // NO reveal background (left swipe)
  const noRevealStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
      [1, 0.3, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  // Icon scale animations
  const yesIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.5, 1.2],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.3],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  const noIconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1.2, 0.5],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.3, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  // Threshold indicator (border glow when past threshold)
  const thresholdGlowStyle = useAnimatedStyle(() => {
    const absX = Math.abs(translateX.value);
    const glowOpacity = interpolate(
      absX,
      [SWIPE_THRESHOLD * 0.8, SWIPE_THRESHOLD],
      [0, 0.6],
      Extrapolation.CLAMP,
    );
    const glowColor =
      translateX.value > 0 ? themeColors.positive : themeColors.negative;

    return {
      borderWidth: glowOpacity > 0 ? 1.5 : 0,
      borderColor: glowColor,
    };
  });

  if (isResolved) {
    const winnerSide = yesPrice >= 0.99 ? "YES" : "NO";
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.card,
            shadowColor: themeColors.cardBorder,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
            opacity: 0.6,
          },
        ]}
        accessibilityLabel={`${market.question}, Resolved: ${winnerSide} won`}
      >
        <View
          style={[styles.accentStripe, { backgroundColor: themeColors.textMuted }]}
        />
        <View style={styles.content}>
          <Text
            style={[styles.question, { color: themeColors.textMuted }]}
            numberOfLines={1}
          >
            {market.question}
          </Text>
          <View style={styles.oddsRow}>
            <Text
              style={[
                styles.resolvedBadge,
                {
                  color: themeColors.textMuted,
                  backgroundColor: themeColors.trackBg,
                },
              ]}
            >
              RESOLVED
            </Text>
            <Text
              style={[
                styles.percentText,
                {
                  color: themeColors.textSecondary,
                  fontVariant: ["tabular-nums"],
                },
              ]}
            >
              {winnerSide} won
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.swipeContainer}>
      {/* YES reveal (right swipe) */}
      <Animated.View
        style={[
          styles.revealBg,
          styles.revealYes,
          { backgroundColor: themeColors.positive + "20" },
          yesRevealStyle,
        ]}
      >
        <Animated.View style={[styles.revealIcon, yesIconStyle]}>
          <Ionicons name="checkmark-circle" size={24} color={themeColors.positive} />
          <Text style={[styles.revealLabel, { color: themeColors.positive }]}>
            YES ${quickBetAmount}
          </Text>
        </Animated.View>
      </Animated.View>

      {/* NO reveal (left swipe) */}
      <Animated.View
        style={[
          styles.revealBg,
          styles.revealNo,
          { backgroundColor: themeColors.negative + "20" },
          noRevealStyle,
        ]}
      >
        <Animated.View style={[styles.revealIcon, noIconStyle]}>
          <Text style={[styles.revealLabel, { color: themeColors.negative }]}>
            NO ${quickBetAmount}
          </Text>
          <Ionicons name="close-circle" size={24} color={themeColors.negative} />
        </Animated.View>
      </Animated.View>

      {/* The actual card */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.card,
              shadowColor: themeColors.cardBorder,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.4,
              shadowRadius: 2,
              elevation: 2,
            },
            cardAnimatedStyle,
            thresholdGlowStyle,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${market.question}, ${yesPercent} percent chance. Swipe right for YES, left for NO.`}
          accessibilityHint="Tap for details, swipe to quick bet"
        >
          {/* Mint accent stripe */}
          <View
            style={[
              styles.accentStripe,
              { backgroundColor: themeColors.accentMint },
            ]}
          />

          <View style={styles.content}>
            {/* Question */}
            <Text
              style={[styles.question, { color: themeColors.textSecondary }]}
              numberOfLines={1}
            >
              {market.question}
            </Text>

            {/* Probability % | bar | meta */}
            <View style={styles.oddsRow}>
              <Text
                style={[
                  styles.percentText,
                  {
                    color: themeColors.positive,
                    fontVariant: ["tabular-nums"],
                  },
                ]}
              >
                {yesPercent}%
              </Text>
              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: themeColors.trackBg },
                ]}
              >
                <View
                  style={[
                    styles.barYes,
                    {
                      width: `${yesPercent}%`,
                      backgroundColor: themeColors.positive,
                    },
                  ]}
                />
              </View>
              {metaText && (
                <Text
                  style={[
                    styles.metaText,
                    {
                      color: themeColors.textMuted,
                      fontVariant: ["tabular-nums"],
                    },
                  ]}
                >
                  {metaText}
                </Text>
              )}
            </View>

            {/* Swipe hint */}
            <View style={styles.swipeHintRow}>
              <Ionicons
                name="swap-horizontal-outline"
                size={10}
                color={themeColors.textFaint}
              />
              <Text style={[styles.swipeHint, { color: themeColors.textFaint }]}>
                Swipe to bet
              </Text>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 10,
  },

  // Reveal backgrounds
  revealBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    justifyContent: "center",
  },
  revealYes: {
    alignItems: "flex-start",
    paddingLeft: 16,
  },
  revealNo: {
    alignItems: "flex-end",
    paddingRight: 16,
  },
  revealIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  revealLabel: {
    fontFamily: fonts.mono.bold,
    fontSize: 11,
    letterSpacing: letterSpacing.wide,
  },

  // Card
  card: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 40,
  },
  accentStripe: {
    width: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  question: {
    fontFamily: fonts.body.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  oddsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  percentText: {
    fontFamily: fonts.mono.bold,
    fontSize: 10,
    letterSpacing: letterSpacing.wide,
    minWidth: 30,
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  barYes: {
    height: "100%",
    borderRadius: 2,
    position: "absolute",
    top: 0,
    left: 0,
  },
  metaText: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    letterSpacing: letterSpacing.wide,
    textAlign: "right",
  },
  resolvedBadge: {
    fontFamily: fonts.mono.bold,
    fontSize: 9,
    letterSpacing: letterSpacing.wide,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  swipeHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  swipeHint: {
    fontFamily: fonts.mono.regular,
    fontSize: 8,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
  },
});
