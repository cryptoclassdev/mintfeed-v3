import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { closeModal } from "@/lib/navigation";
import { colors } from "@/constants/theme";
import { fonts, fontSize, lineHeight, letterSpacing } from "@/constants/typography";
import type { Article, PaginatedResponse } from "@midnight/shared";

function findArticleInFeedCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
): Article | undefined {
  const feedQueries = queryClient.getQueriesData<{ pages: PaginatedResponse<Article>[] }>({
    queryKey: ["feed"],
  });
  for (const [, data] of feedQueries) {
    if (!data?.pages) continue;
    for (const page of data.pages) {
      const match = page.data.find((a) => a.id === id);
      if (match) return match;
    }
  }
  return undefined;
}

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const queryClient = useQueryClient();

  const cachedArticle = id ? findArticleInFeedCache(queryClient, id) : undefined;
  const handleClose = () => closeModal(router);

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: () => api.get(`api/v1/feed/${id}`).json<Article>(),
    enabled: !!id,
    initialData: cachedArticle,
  });

  if (isLoading || !article) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered, { backgroundColor: themeColors.background }]}
      >
        <ActivityIndicator size="large" color={themeColors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close article"
          hitSlop={12}
          style={styles.headerButton}
        >
          <Ionicons name="close" size={28} color={themeColors.text} />
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(article.sourceUrl)}
          accessibilityRole="link"
          accessibilityLabel={`Open full article on ${article.sourceName}`}
          hitSlop={12}
          style={styles.headerButton}
        >
          <Ionicons
            name="open-outline"
            size={22}
            color={themeColors.accent}
          />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
      >
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            accessibilityLabel={`Article image for ${article.title}`}
          />
        ) : null}

        <View style={[styles.badge, { borderColor: themeColors.accent, backgroundColor: themeColors.overlay }]}>
          <Text style={[styles.badgeText, { color: themeColors.accent }]}>
            {article.category}
          </Text>
        </View>

        <Text style={[styles.source, { color: themeColors.textMuted }]}>
          {article.sourceName}
        </Text>

        <Text style={[styles.title, { color: themeColors.text }]}>
          {article.title}
        </Text>

        <Text style={[styles.summary, { color: themeColors.textSecondary }]}>
          {article.summary}
        </Text>

        <Pressable
          style={[styles.readMore, { borderColor: themeColors.accent }]}
          onPress={() => Linking.openURL(article.sourceUrl)}
          accessibilityRole="link"
          accessibilityLabel="Read full article in browser"
        >
          <Text style={[styles.readMoreText, { color: themeColors.accent }]}>
            Read full article
          </Text>
          <Ionicons name="arrow-forward" size={16} color={themeColors.accent} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroImage: {
    width: "100%",
    height: 240,
    borderRadius: 8,
    marginBottom: 16,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    // backgroundColor set dynamically via themeColors.overlay
  },
  badgeText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wide,
  },
  source: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    marginBottom: 8,
    letterSpacing: letterSpacing.wide,
  },
  title: {
    fontFamily: fonts.body.bold,
    fontSize: fontSize.xl,
    lineHeight: lineHeight.xl,
    marginBottom: 16,
  },
  summary: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    marginBottom: 24,
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  readMoreText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
  },
});
