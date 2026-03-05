import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useLiveMarketPrice } from "@/hooks/useLiveMarketPrice";
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

export function PredictionCard({ market }: PredictionCardProps) {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const { data: livePrices } = useLiveMarketPrice(market.id);

  const prices = parsePrices(
    livePrices && Object.keys(livePrices).length > 0
      ? livePrices
      : market.outcomePrices,
  );

  const entries = Object.entries(prices).filter(([, p]) => p > 0);
  const leadingOutcome = entries.reduce(
    (best, [outcome, price]) => (price > best.price ? { outcome, price } : best),
    { outcome: "", price: 0 },
  );
  const hasValidOdds = leadingOutcome.price > 0;
  const percentage = Math.round(leadingOutcome.price * 100);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: themeColors.card },
        pressed && { opacity: 0.7 },
      ]}
      onPress={() => router.push(`/market-sheet/${market.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${market.question}, ${hasValidOdds ? `${leadingOutcome.outcome} at ${percentage} percent` : "no odds yet"}`}
      accessibilityHint="Opens prediction market details"
    >
      {/* Question */}
      <Text style={[styles.question, { color: themeColors.textSecondary }]} numberOfLines={2}>
        {market.question}
      </Text>

      {/* Probability bar + outcome label */}
      {hasValidOdds && (
        <View style={styles.barRow}>
          <View style={[styles.barTrack, { backgroundColor: themeColors.trackBg }]}>
            <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: themeColors.accentMint }]} />
          </View>
          <Text style={[styles.odds, { color: themeColors.accentMint }]}>
            {leadingOutcome.outcome} {percentage}%
          </Text>
        </View>
      )}

      {/* Tap hint */}
      <Text style={[styles.tapHint, { color: themeColors.textFaint }]}>Tap to bet</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    borderRadius: 8,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    gap: 6,
  },
  question: {
    fontFamily: fonts.body.regular,
    fontSize: 12.5,
    lineHeight: 17,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
  odds: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
  },
  tapHint: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
    textAlign: "right",
  },
});
