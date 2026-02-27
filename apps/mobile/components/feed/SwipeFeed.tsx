import { useCallback, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import * as Haptics from "expo-haptics";
import { useFeed } from "@/hooks/useFeed";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { NewsCard } from "./NewsCard";

const PREFETCH_THRESHOLD = 5;

export function SwipeFeed() {
  const theme = useAppStore((s) => s.theme);
  const markAsRead = useAppStore((s) => s.markAsRead);
  const themeColors = colors[theme];
  const pagerRef = useRef<PagerView>(null);

  const query = useFeed();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    query;

  const articles = data?.pages.flatMap((page) => page.data) ?? [];

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const index = e.nativeEvent.position;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const article = articles[index];
      if (article) {
        markAsRead(article.id);
      }

      if (
        hasNextPage &&
        !isFetchingNextPage &&
        index >= articles.length - PREFETCH_THRESHOLD
      ) {
        fetchNextPage();
      }
    },
    [articles, hasNextPage, isFetchingNextPage, fetchNextPage, markAsRead]
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={styles.loadingText}>LOADING FEED</Text>
      </View>
    );
  }

  if (articles.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
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
    >
      {articles.map((article, index) => (
        <View key={article.id} style={styles.page}>
          <NewsCard article={article} variant={index} />
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
  },
  loadingText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    color: "#E60000",
    letterSpacing: 2,
    marginTop: 16,
    textTransform: "uppercase",
  },
  emptyText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
