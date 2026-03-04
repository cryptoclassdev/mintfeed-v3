import { memo } from "react";
import { View, Text, StyleSheet, Pressable, Linking, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { PredictionCard } from "./PredictionCard";
import type { Article } from "@mintfeed/shared";

const IMAGE_HEIGHT_RATIO = 0.28;
const TAB_BAR_HEIGHT = 80;

const NEGATIVE_KEYWORDS = [
  "crash", "drop", "fall", "dump", "panic", "hack", "ban", "plunge",
  "decline", "loss", "fear", "bearish", "sell-off", "liquidation", "scam",
  "fraud", "theft", "vulnerability", "exploit", "attack", "warning", "risk",
  "concern", "tumble", "sink", "plummet", "collapse", "downturn", "recession",
  "slump", "reject", "fail", "penalty", "fine", "lawsuit", "crisis",
];

const POSITIVE_KEYWORDS = [
  "surge", "rally", "rise", "pump", "boom", "launch", "upgrade", "bullish",
  "gain", "profit", "soar", "breakout", "milestone", "adoption", "approval",
  "partnership", "integration", "growth", "record", "high", "success",
  "recover", "bull", "ath", "all-time", "breakthrough", "innovation",
  "support", "accept", "embrace", "fund", "invest", "optimism",
];

type Sentiment = "positive" | "negative" | "neutral";

function detectSentiment(title: string, summary: string): Sentiment {
  const text = `${title} ${summary}`.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (text.includes(keyword)) positiveScore++;
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (text.includes(keyword)) negativeScore++;
  }

  if (positiveScore > negativeScore) return "positive";
  if (negativeScore > positiveScore) return "negative";
  return "neutral";
}

const ACCENT_RED = "#E60000";
const ACCENT_GREEN = "#00ff66";

function getAccentColor(sentiment: Sentiment): string {
  if (sentiment === "positive") return ACCENT_GREEN;
  if (sentiment === "negative") return ACCENT_RED;
  return ACCENT_GREEN;
}

const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

function stripEmoji(text: string): string {
  return text.replace(EMOJI_REGEX, "").replace(/\s{2,}/g, " ").trim();
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NewsCardProps {
  article: Article;
}

export const NewsCard = memo(function NewsCard({ article }: NewsCardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const imageHeight = screenHeight * IMAGE_HEIGHT_RATIO;

  const sentiment = detectSentiment(article.title, article.summary);
  const accentColor = getAccentColor(sentiment);
  const cleanTitle = stripEmoji(article.title);
  const cleanSummary = stripEmoji(article.summary);

  const markets = (article.predictionMarkets ?? []).filter((m, i, arr) => {
    const firstById = arr.findIndex((x) => x.id === m.id);
    const firstByQuestion = arr.findIndex((x) => x.question === m.question);
    return firstById === i && firstByQuestion === i;
  });

  return (
    <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
      {/* Top: Image zone */}
      <View style={[styles.imageZone, { height: imageHeight }]}>
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            placeholder={article.imageBlurhash ?? undefined}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}

        {/* Gradient fade from image into content */}
        <LinearGradient
          colors={["transparent", "rgba(3,3,3,0.6)", "#030303"]}
          locations={[0.3, 0.7, 1]}
          style={styles.imageGradient}
        />

        {/* Category badge on the image */}
        <View style={[styles.badge, { borderColor: accentColor }]}>
          <Text style={[styles.badgeText, { color: accentColor }]}>
            {article.category}
          </Text>
        </View>
      </View>

      {/* Bottom: Content zone */}
      <View style={styles.contentZone}>
        {/* Decorative accent line */}
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />

        {/* Title */}
        <Text style={styles.title}>{cleanTitle}</Text>

        {/* Source + time + read more link */}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{article.sourceName}</Text>
          <Text style={[styles.metaDot, { color: accentColor }]}>·</Text>
          <Text style={styles.metaText}>{timeAgo(article.publishedAt)}</Text>
          <Text style={[styles.metaDot, { color: accentColor }]}>·</Text>
          <Pressable
            onPress={() => Linking.openURL(article.sourceUrl)}
            hitSlop={8}
          >
            <Text style={[styles.sourceLink, { color: accentColor }]}>
              Read full article
            </Text>
          </Pressable>
        </View>

        {/* Summary */}
        <Text style={styles.summary}>{cleanSummary}</Text>

        {/* Prediction markets (up to 3) */}
        {markets.length > 0 && (
          <View style={styles.marketsContainer}>
            {markets.map((market) => (
              <PredictionCard key={market.id} market={market} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030303",
  },

  /* Image zone */
  imageZone: {
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111111",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  badge: {
    position: "absolute",
    bottom: 16,
    left: 24,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderCurve: "continuous",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  badgeText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wide,
  },

  /* Content zone */
  contentZone: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: TAB_BAR_HEIGHT + 16,
  },
  accentLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.body.bold,
    fontSize: 22,
    lineHeight: 30,
    color: "#f0f0f0",
    marginBottom: 16,
  },
  summary: {
    fontFamily: fonts.body.regular,
    fontSize: 15,
    lineHeight: 24,
    color: "#b0b0b0",
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  metaText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: "#666666",
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
  },
  metaDot: {
    fontSize: 14,
    fontWeight: "700",
  },
  sourceLink: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    textDecorationLine: "underline",
    textTransform: "uppercase",
  },
  marketsContainer: {
    gap: 4,
  },
});
