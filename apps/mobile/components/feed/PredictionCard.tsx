import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as haptics from '@/lib/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useLiveMarketPrice } from "@/hooks/useLiveMarketPrice";
import { formatCompactVolume, formatCompactDate } from "@mintfeed/shared";
import type { PredictionMarket } from "@mintfeed/shared";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PredictionCardProps {
  market: PredictionMarket;
}

function parsePrices(raw: unknown): Record<string, number> {
  if (!raw) return {};
  const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    result[k] = typeof v === "number" ? v : parseFloat(String(v)) || 0;
  }
  return result;
}

export const PredictionCard = memo(function PredictionCard({
  market,
}: PredictionCardProps) {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const { data: livePrices } = useLiveMarketPrice(market.id);

  // Animation values
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(10);
  const barWidth = useSharedValue(0);

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
  const hasOdds = yesPrice > 0 || noPrice > 0;
  const isResolved = yesPrice >= 0.99 || noPrice >= 0.99;
  const winnerSide = yesPrice >= 0.99 ? "YES" : "NO";

  const parts: string[] = [];
  const dateStr = formatCompactDate(market.endDate);
  if (dateStr) parts.push(dateStr);
  const volStr = formatCompactVolume(market.volume ?? 0);
  if (volStr) parts.push(volStr);
  const metaText = parts.join(" \u00B7 ") || null;

  // Trigger enter animations on mount
  React.useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardTranslateY.value = withTiming(0, { duration: 300 });
    
    // Animate the progress bar
    if (hasOdds) {
      setTimeout(() => {
        barWidth.value = withSpring(yesPercent, { damping: 20, stiffness: 300 });
      }, 150);
    }
  }, [hasOdds, yesPercent]);

  // Animated styles
  const scaleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const barAnimatedStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  // Press handlers
  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    haptics.lightImpact();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  if (isResolved) {
    return (
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.card,
            // Using shadows instead of borders for depth
            shadowColor: themeColors.cardBorder,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
            opacity: 0.6,
          },
          cardAnimatedStyle,
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
            <Text style={[
              styles.resolvedBadge, 
              { 
                color: themeColors.textMuted, 
                backgroundColor: themeColors.trackBg,
                borderRadius: 6, // Concentric with parent padding
              }
            ]}>
              RESOLVED
            </Text>
            <Text style={[
              styles.percentText, 
              { 
                color: themeColors.textSecondary,
                fontVariant: ['tabular-nums'], // Consistent number spacing
              }
            ]}>
              {winnerSide} won
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  const accessLabel = `${market.question}, ${yesPercent} percent chance${dateStr ? `, resolves ${dateStr}` : ""}`;

  return (
    <AnimatedPressable
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card,
          // Using shadows instead of solid borders
          shadowColor: themeColors.cardBorder,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.4,
          shadowRadius: 2,
          elevation: 2,
        },
        scaleAnimatedStyle,
        cardAnimatedStyle,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => router.push({
        pathname: `/market-sheet/${market.id}`,
        params: { question: market.question },
      })}
      accessibilityRole="button"
      accessibilityLabel={accessLabel}
      accessibilityHint="Opens prediction market details"
      hitSlop={8} // Better hit area
    >
      {/* Mint accent stripe */}
      <View
        style={[styles.accentStripe, { backgroundColor: themeColors.accentMint }]}
      />

      <View style={styles.content}>
        {/* Question */}
        <Text
          style={[styles.question, { color: themeColors.textSecondary }]}
          numberOfLines={1}
        >
          {market.question}
        </Text>

        {/* Probability % | bar | meta (date · volume) */}
        {hasOdds && (
          <View style={styles.oddsRow}>
            <Text style={[
              styles.percentText, 
              { 
                color: themeColors.positive,
                fontVariant: ['tabular-nums'], // Prevent layout shift on number updates
              }
            ]}>
              {yesPercent}%
            </Text>
            <View style={[styles.barTrack, { backgroundColor: themeColors.trackBg }]}>
              <Animated.View
                style={[
                  styles.barYes,
                  {
                    backgroundColor: themeColors.positive,
                  },
                  barAnimatedStyle,
                ]}
              />
            </View>
            {metaText && (
              <Text style={[
                styles.metaText, 
                { 
                  color: themeColors.textMuted,
                  fontVariant: ['tabular-nums'], // For consistent volume/date formatting
                }
              ]}>
                {metaText}
              </Text>
            )}
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 40, // Minimum 40px hit area
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
    overflow: "hidden",
  },
});