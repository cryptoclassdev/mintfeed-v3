import { View, Text, StyleSheet, Dimensions, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import type { Article } from "@mintfeed/shared";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HEADLINE_WORDS: Record<string, string> = {
  crash: "CRASH",
  drop: "DROP",
  fall: "FALL",
  dump: "DUMP",
  panic: "PANIC",
  surge: "SURGE",
  rally: "RALLY",
  rise: "RISE",
  pump: "PUMP",
  boom: "BOOM",
  hack: "HACK",
  launch: "LAUNCH",
  update: "UPDATE",
  ban: "BAN",
  SEC: "SEC",
  ETF: "ETF",
  AI: "AI",
  fork: "FORK",
  merge: "MERGE",
  stake: "STAKE",
};

function extractHeadlineWord(title: string): string {
  const lower = title.toLowerCase();
  for (const [keyword, display] of Object.entries(HEADLINE_WORDS)) {
    if (lower.includes(keyword.toLowerCase())) return display;
  }
  const words = title.split(/\s+/).filter((w) => w.length > 3);
  return (words[0] ?? "NEWS").toUpperCase();
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 60) return "JUST NOW";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

const ACCENT_RED = "#E60000";
const ACCENT_GREEN = "#00ff66";

interface NewsCardProps {
  article: Article;
  variant?: number;
}

export function NewsCard({ article, variant = 0 }: NewsCardProps) {
  const router = useRouter();
  const isEvenVariant = variant % 2 === 0;
  const accentColor = isEvenVariant ? ACCENT_RED : ACCENT_GREEN;
  const headlineWord = extractHeadlineWord(article.title);

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.push(`/article/${article.id}`)}
    >
      {/* Background image layer */}
      {article.imageUrl && (
        <Image
          source={{ uri: article.imageUrl }}
          placeholder={article.imageBlurhash ?? undefined}
          style={styles.bgImage}
          contentFit="cover"
          transition={300}
        />
      )}

      {/* Dark gradient overlay on image */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.7)",
          "rgba(0,0,0,0.3)",
          "rgba(0,0,0,0.85)",
        ]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Card gradient background (blends with image) */}
      <LinearGradient
        colors={
          isEvenVariant
            ? ["rgba(0,0,0,0.6)", "rgba(26,5,5,0.4)", "rgba(42,0,0,0.5)"]
            : ["rgba(0,0,0,0.6)", "rgba(5,5,5,0.3)", "rgba(10,10,10,0.5)"]
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Water line subtle gradient at bottom */}
      <LinearGradient
        colors={[
          "transparent",
          isEvenVariant ? "rgba(230,0,0,0.05)" : "rgba(0,255,102,0.03)",
        ]}
        style={styles.waterLine}
      />

      {/* Decorative stars */}
      <Text style={[styles.decoStar, styles.starTL, { color: accentColor }]}>
        ✶
      </Text>
      <Text style={[styles.decoStar, styles.starBR, { color: accentColor }]}>
        ✶
      </Text>

      {/* Massive headline overlay */}
      <View style={styles.headlineLayer} pointerEvents="none">
        <Text
          style={[
            styles.headlineMassive,
            isEvenVariant
              ? { color: ACCENT_RED }
              : {
                  color: "rgba(20,20,20,0.9)",
                },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {headlineWord}
        </Text>
      </View>

      {/* Content layer at bottom */}
      <View style={styles.contentLayer}>
        {/* Meta tag */}
        <View style={[styles.metaTag, { borderColor: accentColor }]}>
          <Text style={[styles.metaTagText, { color: accentColor }]}>
            {article.category}
          </Text>
        </View>

        {/* News title */}
        <Text style={styles.newsTitle} numberOfLines={3}>
          {article.title}
        </Text>

        {/* News snippet */}
        <View style={[styles.snippetContainer, { borderLeftColor: accentColor }]}>
          <Text style={styles.newsSnippet} numberOfLines={3}>
            {article.summary}
          </Text>
        </View>

        {/* Tech stat grid */}
        <View style={styles.statGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>SOURCE</Text>
            <Text style={styles.statValue}>{article.sourceName.toUpperCase()}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>PUBLISHED</Text>
            <Text style={styles.statValue}>{timeAgo(article.publishedAt)}</Text>
          </View>
        </View>
      </View>

      {/* Action sidebar */}
      <View style={styles.actionSidebar}>
        <View style={styles.actionGroup}>
          <View style={styles.actionBtn}>
            <Ionicons name="heart-outline" size={20} color="white" />
          </View>
        </View>
        <View style={styles.actionGroup}>
          <View style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color="white" />
          </View>
        </View>
        <View style={styles.actionGroup}>
          <View style={styles.actionBtn}>
            <Ionicons name="share-outline" size={20} color="white" />
          </View>
          <Text style={styles.actionLabel}>SHARE</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
    height: "100%",
    opacity: 0.4,
  },
  waterLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "40%",
  },
  decoStar: {
    position: "absolute",
    fontSize: 16,
    zIndex: 5,
    opacity: 0.6,
  },
  starTL: {
    top: 80,
    left: 20,
  },
  starBR: {
    bottom: 120,
    right: 20,
  },
  headlineLayer: {
    position: "absolute",
    top: "15%",
    left: 0,
    width: "100%",
    alignItems: "center",
    zIndex: 0,
    opacity: 0.8,
  },
  headlineMassive: {
    fontFamily: fonts.display.regular,
    fontSize: SCREEN_WIDTH * 0.28,
    lineHeight: SCREEN_WIDTH * 0.28,
    textTransform: "uppercase",
    letterSpacing: -2,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 20 },
    textShadowRadius: 50,
  },
  contentLayer: {
    position: "relative",
    zIndex: 5,
    paddingHorizontal: 24,
    paddingBottom: 100,
    maxWidth: "85%",
  },
  metaTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  metaTagText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wide,
  },
  newsTitle: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize.xl,
    lineHeight: 30,
    color: "#f0f0f0",
    textTransform: "uppercase",
    letterSpacing: letterSpacing.tight,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  snippetContainer: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  newsSnippet: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    color: "#cccccc",
    lineHeight: 18,
  },
  statGrid: {
    flexDirection: "row",
    gap: 24,
    marginTop: 4,
  },
  statItem: {},
  statLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: "#888888",
    letterSpacing: letterSpacing.wide,
  },
  statValue: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: "#f0f0f0",
    marginTop: 2,
  },
  actionSidebar: {
    position: "absolute",
    right: 16,
    bottom: 110,
    alignItems: "center",
    gap: 24,
    zIndex: 20,
  },
  actionGroup: {
    alignItems: "center",
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
});
