import { memo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useLiveMarketPrice } from "@/hooks/useLiveMarketPrice";
import { formatCompactVolume, formatCompactDate } from "@mintfeed/shared";
import type { PredictionMarket } from "@mintfeed/shared";

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

  if (isResolved) {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.cardBorder,
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
            <Text style={[styles.resolvedBadge, { color: themeColors.textMuted, backgroundColor: themeColors.trackBg }]}>
              RESOLVED
            </Text>
            <Text style={[styles.percentText, { color: themeColors.textSecondary }]}>
              {winnerSide} won
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const accessLabel = `${market.question}, ${yesPercent} percent chance${dateStr ? `, resolves ${dateStr}` : ""}`;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.cardBorder,
        },
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push({
        pathname: `/market-sheet/${market.id}`,
        params: { question: market.question },
      })}
      accessibilityRole="button"
      accessibilityLabel={accessLabel}
      accessibilityHint="Opens prediction market details"
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
            <Text style={[styles.percentText, { color: themeColors.positive }]}>
              {yesPercent}%
            </Text>
            <View style={[styles.barTrack, { backgroundColor: themeColors.trackBg }]}>
              <View
                style={[
                  styles.barYes,
                  {
                    flex: yesPercent || 1,
                    backgroundColor: themeColors.positive,
                  },
                ]}
              />
              <View style={{ flex: (100 - yesPercent) || 1 }} />
            </View>
            {metaText && (
              <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                {metaText}
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 8,
    borderCurve: "continuous",
    borderWidth: 0.5,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.7,
  },
  accentStripe: {
    width: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    flexDirection: "row",
  },
  barYes: {
    height: "100%",
    borderRadius: 2,
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
    borderRadius: 4,
    overflow: "hidden",
  },
});
