import React, { memo } from "react";
import { View, Text, StyleSheet, Pressable, Linking, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { PredictionCard } from "./PredictionCard";
import { getNewsCardBottomPadding } from "./news-card-layout";
import type { Article } from "@mintfeed/shared";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IMAGE_HEIGHT_RATIO = 0.28;

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

function getSentimentColor(sentiment: Sentiment, themeColors: { positive: string; negative: string }): string {
  if (sentiment === "positive") return themeColors.positive;
  if (sentiment === "negative") return themeColors.negative;
  return themeColors.positive;
}

function getCategoryColor(category: string, themeColors: { categoryCrypto: string; categoryAi: string }): string {
  if (category === "CRYPTO") return themeColors.categoryCrypto;
  if (category === "AI") return themeColors.categoryAi;
  return themeColors.categoryCrypto;
}

const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

function stripEmoji(text: string): string {
  return text.replace(EMOJI_REGEX, "").replace(/\s{2,}/g, " ").trim();
}

const SUMMARY_WORD_LIMIT = 60;

function truncateSummary(text: string): string {
  const words = text.split(/\s+/);
  if (words.length <= SUMMARY_WORD_LIMIT) return text;
  return words.slice(0, SUMMARY_WORD_LIMIT).join(" ") + "...";
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

const MAX_VISIBLE_MARKETS = 3;

export const NewsCard = memo(function NewsCard({ article }: NewsCardProps) {
  const { height: screenHeight } = useWindowDimensions();
  const { bottom: safeBottom } = useSafeAreaInsets();
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const imageHeight = screenHeight * IMAGE_HEIGHT_RATIO;
  const bottomPadding = getNewsCardBottomPadding(safeBottom);

  // Animation values
  const linkScale = useSharedValue(1);
  const createMarketScale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const marketsOpacity = useSharedValue(0);
  const marketsTranslateY = useSharedValue(10);

  // Trigger enter animations on mount
  React.useEffect(() => {
    // Content animation
    contentOpacity.value = withTiming(1, { duration: 400 });
    contentTranslateY.value = withTiming(0, { duration: 400 });
    
    // Markets animation (staggered)
    setTimeout(() => {
      marketsOpacity.value = withTiming(1, { duration: 300 });
      marketsTranslateY.value = withTiming(0, { duration: 300 });
    }, 100);
  }, []);

  const sentiment = detectSentiment(article.title, article.summary);
  const sentimentColor = getSentimentColor(sentiment, themeColors);
  const categoryColor = getCategoryColor(article.category, themeColors);
  const cleanTitle = stripEmoji(article.title);
  const cleanSummary = truncateSummary(stripEmoji(article.summary));

  const markets = (article.predictionMarkets ?? [])
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
    .filter((m) => {
      const op = m.outcomePrices as Record<string, unknown> | null;
      return op && "Yes" in op && "No" in op;
    });

  // Animated styles
  const linkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: linkScale.value }],
  }));

  const createMarketAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: createMarketScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const marketsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: marketsOpacity.value,
    transform: [{ translateY: marketsTranslateY.value }],
  }));

  // Press handlers
  const handleLinkPressIn = () => {
    linkScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handleLinkPressOut = () => {
    linkScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleCreateMarketPressIn = () => {
    createMarketScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handleCreateMarketPressOut = () => {
    createMarketScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Top: Image zone */}
      <View style={[styles.imageZone, { height: imageHeight }]}>
        {article.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: article.imageUrl }}
              placeholder={article.imageBlurhash ?? undefined}
              style={styles.image}
              contentFit="cover"
              transition={300}
              accessibilityLabel={`Image for ${article.sourceName} article`}
            />
            {/* Subtle image outline */}
            <View style={[styles.imageOutline, { borderColor: `${themeColors.border}40` }]} />
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: themeColors.card }]} />
        )}

        {/* Gradient fade from image into content */}
        <LinearGradient
          colors={["transparent", themeColors.gradientMid, themeColors.background]}
          locations={[0.3, 0.7, 1]}
          style={styles.imageGradient}
        />

        {/* Category badge on the image with better shadows */}
        <View style={[styles.badgeContainer]}>
          <View style={[
            styles.badge, 
            { 
              backgroundColor: themeColors.overlayStrong,
              // Concentric border radius: outer = inner + padding
              borderRadius: 14, // inner: 10, padding: 4
            },
            {
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }
          ]}>
            <Text style={[styles.badgeText, { color: categoryColor }]}>
              {article.category}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom: Content zone with enter animation */}
      <Animated.View style={[
        styles.contentZone, 
        { paddingBottom: bottomPadding },
        contentAnimatedStyle
      ]}>
        {/* Decorative accent line — sentiment-colored with rounded ends */}
        <View style={[styles.accentLine, { backgroundColor: sentimentColor }]} />

        {/* Title with better typography */}
        <Text style={[
          styles.title, 
          { 
            color: themeColors.text,
            // Text balancing for better wrapping
            textAlign: 'left',
          }
        ]}>
          {cleanTitle}
        </Text>

        {/* Source + time + read more link with tabular numbers */}
        <View style={styles.meta}>
          <Text style={[
            styles.metaText, 
            { 
              color: themeColors.textMuted,
              fontVariant: ['tabular-nums'], // For consistent number spacing
            }
          ]}>
            {article.sourceName}
          </Text>
          <Text style={[styles.metaDot, { color: themeColors.textMuted }]}>·</Text>
          <Text style={[
            styles.metaText, 
            { 
              color: themeColors.textMuted,
              fontVariant: ['tabular-nums'], // Prevent layout shift as time updates
            }
          ]}>
            {timeAgo(article.publishedAt)}
          </Text>
          <Text style={[styles.metaDot, { color: themeColors.textMuted }]}>·</Text>
          
          {/* Enhanced read more link with scale animation and larger hit area */}
          <AnimatedPressable
            onPress={() => Linking.openURL(article.sourceUrl)}
            onPressIn={handleLinkPressIn}
            onPressOut={handleLinkPressOut}
            hitSlop={16} // Larger hit area for better accessibility
            accessibilityRole="link"
            accessibilityLabel={`Read full article from ${article.sourceName}`}
            style={[styles.sourceLinkTouchable, linkAnimatedStyle]}
          >
            <Text style={[styles.sourceLink, { color: themeColors.accent }]}>
              Read full article
            </Text>
          </AnimatedPressable>
        </View>

        {/* Summary with better text wrapping */}
        <Text style={[
          styles.summary, 
          { 
            color: themeColors.textSecondary,
            // Better text wrapping to avoid orphans
            textAlign: 'left',
          }
        ]}>
          {cleanSummary}
        </Text>

        {/* Prediction markets with staggered enter animation */}
        {markets.length > 0 ? (
          <Animated.View style={[styles.marketsSection, marketsAnimatedStyle]}>
            <View style={styles.marketsHeader}>
              <Ionicons
                name="pulse-outline"
                size={12}
                color={themeColors.accentMint}
              />
              <Text style={[styles.marketsLabel, { color: themeColors.accentMint }]}>
                RELATED MARKETS
              </Text>
            </View>
            <View style={styles.marketsStack}>
              {markets.slice(0, MAX_VISIBLE_MARKETS).map((market) => (
                <PredictionCard key={market.id} market={market} />
              ))}
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={marketsAnimatedStyle}>
            <AnimatedPressable
              style={[
                styles.createMarketButton,
                {
                  backgroundColor: themeColors.card,
                  // Using shadows instead of solid borders
                  shadowColor: themeColors.cardBorder,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 2,
                  elevation: 2,
                  borderRadius: 12, // Concentric with inner content
                },
                createMarketAnimatedStyle
              ]}
              disabled
              onPressIn={handleCreateMarketPressIn}
              onPressOut={handleCreateMarketPressOut}
              hitSlop={8} // Better hit area
            >
              <Text style={[styles.createMarketText, { color: themeColors.textMuted }]}>
                + Create a Market
              </Text>
              <Text style={[
                styles.comingSoonBadge, 
                {
                  color: themeColors.textFaint,
                  backgroundColor: themeColors.trackBg,
                  borderRadius: 6, // Concentric: outer 12 - padding 6 = inner 6
                }
              ]}>
                Coming Soon
              </Text>
            </AnimatedPressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Image zone */
  imageZone: {
    width: "100%",
    position: "relative",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  // Subtle outline for images for better depth perception
  imageOutline: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 0,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  badgeContainer: {
    position: "absolute",
    bottom: 16,
    left: 24,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    // borderRadius set dynamically for concentric radius
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
    // paddingBottom set dynamically via safeAreaInsets
  },
  accentLine: {
    width: 32,
    height: 3,
    borderRadius: 1.5, // Rounded ends for softer appearance
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.body.bold,
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 10,
  },
  summary: {
    fontFamily: fonts.body.regular,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  metaText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
  },
  metaDot: {
    fontSize: 14,
    fontWeight: "700",
  },
  sourceLinkTouchable: {
    minHeight: 40, // Minimum 40px hit area
    minWidth: 40,
    justifyContent: "center" as const,
    alignItems: "flex-start" as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sourceLink: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    textDecorationLine: "underline",
    textTransform: "uppercase",
  },
  marketsSection: {
    gap: 6,
    marginTop: 4,
  },
  marketsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  marketsLabel: {
    fontFamily: fonts.mono.bold,
    fontSize: 9,
    letterSpacing: letterSpacing.wider,
  },
  marketsStack: {
    gap: 6,
  },
  createMarketButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 6,
    opacity: 0.7,
    minHeight: 40, // Minimum 40px hit area
  },
  createMarketText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
  },
  comingSoonBadge: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wide,
  },
});