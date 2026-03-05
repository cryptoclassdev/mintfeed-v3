import { useCallback, useMemo, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Pressable } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import * as Haptics from "expo-haptics";
import { useFeed } from "@/hooks/useFeed";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { NewsCard } from "./NewsCard";
import type { Article } from "@mintfeed/shared";

const PREFETCH_THRESHOLD = 5;
const EMPTY_ARTICLES: Article[] = [];

export function SwipeFeed() {
  const theme = useAppStore((s) => s.theme);
  const markAsRead = useAppStore((s) => s.markAsRead);
  const themeColors = colors[theme];
  const pagerRef = useRef<PagerView>(null);

  const query = useFeed();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    query;

  const articles = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? EMPTY_ARTICLES,
    [data?.pages]
  );

  const articlesRef = useRef(articles);
  articlesRef.current = articles;

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const index = e.nativeEvent.position;
      const currentArticles = articlesRef.current;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const article = currentArticles[index];
      if (article) {
        markAsRead(article.id);
      }

      if (
        hasNextPage &&
        !isFetchingNextPage &&
        index >= currentArticles.length - PREFETCH_THRESHOLD
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage, markAsRead]
  );

  if (isLoading) {
    return (
      <View style={styles.centered} accessibilityLabel="Loading feed">
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.statusText, { color: themeColors.accent }]}>LOADING FEED</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.statusText, { color: themeColors.negative }]}>FAILED TO LOAD</Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading feed"
          style={[styles.retryButton, { borderColor: themeColors.accent }]}
        >
          <Text style={[styles.retryText, { color: themeColors.accent }]}>TAP TO RETRY</Text>
        </Pressable>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.statusText, { color: themeColors.textMuted }]}>
          NO ARTICLES YET
        </Text>
      </View>
    );
  }

  return (
    <PagerView
      ref={pagerRef}
      style={styles.pager}
      orientation="vertical"
      initialPage={0}
      offscreenPageLimit={2}
      onPageSelected={onPageSelected}
      accessibilityLabel="News feed, swipe up or down to browse"
    >
      {articles.map((article) => (
        <View key={article.id} style={styles.page}>
          <NewsCard article={article} />
        </View>
      ))}
    </PagerView>
  );
}

const styles = StyleSheet.create({
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  statusText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  retryText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
