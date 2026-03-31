import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Pressable } from "react-native";
import PagerView, {
  type PagerViewOnPageSelectedEvent,
} from "react-native-pager-view";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  runOnJS,
} from 'react-native-reanimated';
import * as haptics from "@/lib/haptics";
import { useFeed } from "@/hooks/useFeed";
import { useSwipeBet } from "@/hooks/useSwipeBet";
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
  const pendingArticleId = useAppStore((s) => s.pendingArticleId);
  const setPendingArticleId = useAppStore((s) => s.setPendingArticleId);
  const setCategory = useAppStore((s) => s.setCategory);

  // Swipe-to-bet hook
  const { swipeBet, walletConnected } = useSwipeBet();

  // Animation values
  const retryScale = useSharedValue(1);
  const pullOffset = useSharedValue(0);
  const refreshOpacity = useSharedValue(0);
  const refreshScale = useSharedValue(0.8);
  const hapticFired = useSharedValue(false);

  const query = useFeed();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch, isRefetching } =
    query;

  const articles = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.data) ?? EMPTY_ARTICLES;
    return dedupeArticlesByContent(all);
  }, [data?.pages]);

  const articlesRef = useRef(articles);
  articlesRef.current = articles;

  // Navigate to article from notification deep-link
  // Resets category to "all", refetches, then scrolls to the article
  const pendingHandled = useRef<string | null>(null);
  useEffect(() => {
    if (!pendingArticleId) return;

    // On first trigger: reset category and refetch to ensure article is available
    if (pendingHandled.current !== pendingArticleId) {
      pendingHandled.current = pendingArticleId;
      setCategory("all");
      refetch();
      return;
    }

    // After refetch: find and scroll to the article
    if (articles.length === 0) return;
    const index = articles.findIndex((a) => a.id === pendingArticleId);
    if (index !== -1) {
      pagerRef.current?.setPageWithoutAnimation(index);
      setCurrentIndex(index);
      setPendingArticleId(null);
    }
  }, [pendingArticleId, articles, setPendingArticleId, setCategory, refetch]);

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const index = e.nativeEvent.position;
      const currentArticles = articlesRef.current;

      setCurrentIndex(index);
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

  const pullAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pullOffset.value }],
  }));

  const refreshIndicatorStyle = useAnimatedStyle(() => ({
    opacity: refreshOpacity.value,
    transform: [{ scale: refreshScale.value }],
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

  const handleRefresh = () => {
    haptics.selection();
    refetch();
  };

  // Pull-to-refresh gesture (only on page 0)
  // activeOffsetY(15): only activate after 15px downward pull
  // failOffsetY(-5): fail instantly on upward swipe → PagerView handles it
  // failOffsetX: fail on horizontal movement
  const panGesture = Gesture.Pan()
    .enabled(currentIndex === 0)
    .activeOffsetY(15)
    .failOffsetY(-5)
    .failOffsetX([-10, 10])
    .onStart(() => {
      hapticFired.value = false;
    })
    .onUpdate((e) => {
      if (e.translationY > 0) {
        pullOffset.value = Math.min(e.translationY, 120);
        refreshOpacity.value = Math.min(pullOffset.value / 80, 1);
        refreshScale.value = 0.8 + refreshOpacity.value * 0.2;

        // Haptic once when crossing the 80px threshold
        if (e.translationY > 80 && !hapticFired.value) {
          hapticFired.value = true;
          runOnJS(haptics.selection)();
        }
      }
    })
    .onEnd(() => {
      if (pullOffset.value > 80) {
        runOnJS(handleRefresh)();
        pullOffset.value = withSpring(0, { damping: 12, stiffness: 100 });
        refreshOpacity.value = withTiming(0, { duration: 300 });
        refreshScale.value = withSpring(0.8, { damping: 12, stiffness: 100 });
      } else {
        pullOffset.value = withSpring(0, { damping: 15, stiffness: 200 });
        refreshOpacity.value = withTiming(0, { duration: 200 });
        refreshScale.value = withSpring(0.8, { damping: 15, stiffness: 200 });
      }
    });

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
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {/* Pull-to-refresh indicator (only on page 0) */}
        {currentIndex === 0 && (
          <Animated.View style={[styles.refreshHeader, pullAnimatedStyle]}>
            <Animated.View style={[styles.refreshIndicator, refreshIndicatorStyle]}>
              {isRefetching ? (
                <ActivityIndicator
                  size="small"
                  color={themeColors.accent}
                  style={styles.spinner}
                />
              ) : (
                <Text style={[styles.refreshIcon, { color: themeColors.accent }]}>
                  ↓
                </Text>
              )}
            </Animated.View>
          </Animated.View>
        )}

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
                {isNearby ? (
                  <NewsCard
                    article={article}
                    onSwipeBet={swipeBet}
                    walletConnected={walletConnected}
                  />
                ) : null}
              </View>
            );
          })}
        </PagerView>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  refreshHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  refreshIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  spinner: {
    width: 24,
    height: 24,
  },
  refreshIcon: {
    fontSize: 24,
    fontWeight: "600",
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