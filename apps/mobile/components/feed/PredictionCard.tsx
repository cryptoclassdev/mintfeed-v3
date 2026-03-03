import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useLiveMarketPrice } from "@/hooks/useLiveMarketPrice";
import type { PredictionMarket } from "@mintfeed/shared";

const ACCENT = "#00D4AA";

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

  // Use live prices when available, fall back to pre-fetched prices
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
      <View style={styles.left}>
        <Text style={styles.label}>JUPITER</Text>
        <Text style={styles.question} numberOfLines={1}>
          {market.question}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.odds}>
          {hasValidOdds ? `${leadingOutcome.outcome} ${percentage}%` : "—"}
        </Text>
        <Ionicons name="open-outline" size={10} color="#555" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    gap: 12,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    color: ACCENT,
    letterSpacing: letterSpacing.wider,
    textTransform: "uppercase",
  },
  question: {
    fontFamily: fonts.body.regular,
    fontSize: 13,
    lineHeight: 17,
    color: "#d0d0d0",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  odds: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: ACCENT,
    letterSpacing: letterSpacing.wide,
  },
});
