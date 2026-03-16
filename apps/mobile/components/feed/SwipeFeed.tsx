import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Pressable } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import * as haptics from '@/lib/haptics';
import { useFeed } from "@/hooks/useFeed";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { NewsCard } from "./NewsCard";
import { dedupeArticlesByContent, type Article } from "@mintfeed/shared";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PREFETCH_THRESHOLD = 5;
const RENDER_WINDOW = 4;
const EMPTY_ARTICLES: Article[] = [];

export function SwipeFeed() {
  const theme = useAppStore((s) => s.theme);
  const markAsRead = useAppStore((s) => s.markAsRead);
  const themeColors = colors[theme];
  const pagerRef = useRef<PagerView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animation values
  const retryScale = useSharedValue(1);

  const query = useFeed();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    query;

  const articles = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.data) ?? EMPTY_ARTICLES;
    return dedupeArticlesByContent(all);
  }, [data?.pages]);

  const articlesRef = useRef(articles);
  articlesRef.current = articles;

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const index = e.nativeEvent.position;
      const currentArticles = articlesRef.current;

      setCurrentIndex(index);

      // Light haptic on page swipe
      haptics.selection();

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

  // Animated styles
  const retryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  // Press handlers
  const handleRetryPressIn = () => {
    retryScale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handleRetryPressOut = () => {
    retryScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleRetry = () => {
    haptics.mediumImpact();
    refetch();
  };

  if (isLoading) {
    return (
      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.centered}
        accessibilityLabel="Loading feed"
      >
        <ActivityIndicator size="large" color={themeColors.accent} />
        <Text style={[styles.statusText, { color: themeColors.accent }]}>
          LOADING FEED
        </Text>
      </Animated.View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.statusText, { color: themeColors.negative }]}>
          FAILED TO LOAD
        </Text>
        <AnimatedPressable
          onPress={handleRetry}
          onPressIn={handleRetryPressIn}
          onPressOut={handleRetryPressOut}
          accessibilityRole="button"
          accessibilityLabel="Retry loading feed"
          style={[
            styles.retryButton,
            {
              backgroundColor: themeColors.card,
              shadowColor: themeColors.accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
              borderRadius: 12,
            },
            retryAnimatedStyle,
          ]}
          hitSlop={8}
        >
          <Text style={[styles.retryText, { color: themeColors.accent }]}>
            TAP TO RETRY
          </Text>
        </AnimatedPressable>
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
      {articles.map((article, index) => {
        const isNearby = Math.abs(index - currentIndex) <= RENDER_WINDOW;
        return (
          <View key={article.id} style={styles.page}>
            {isNearby ? <NewsCard article={article} /> : null}
          </View>
        );
      })}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 48,
    justifyContent: "center",
  },
  retryText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});