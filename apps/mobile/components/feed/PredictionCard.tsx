import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useLiveMarketPrice } from "@/hooks/useLiveMarketPrice";
import type { PredictionMarket } from "@mintfeed/shared";

const ACCENT = "#00D4AA";
const TRACK_COLOR = "#1a1a1a";

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
      style={styles.container}
      onPress={() => Linking.openURL(market.marketUrl)}
    >
      {/* Question + link icon */}
      <View style={styles.questionRow}>
        <Text style={styles.question}>{market.question}</Text>
        <Ionicons name="open-outline" size={10} color="#444" style={styles.linkIcon} />
      </View>

      {/* Probability bar + outcome label */}
      {hasValidOdds && (
        <View style={styles.barRow}>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${percentage}%` }]} />
          </View>
          <Text style={styles.odds}>
            {leadingOutcome.outcome} {percentage}%
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    backgroundColor: "#111111",
    borderRadius: 8,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
    gap: 6,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  question: {
    flex: 1,
    fontFamily: fonts.body.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: "#d0d0d0",
  },
  linkIcon: {
    marginTop: 3,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    height: 3,
    backgroundColor: TRACK_COLOR,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: ACCENT,
    borderRadius: 2,
  },
  odds: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: ACCENT,
    letterSpacing: letterSpacing.wide,
  },
});
