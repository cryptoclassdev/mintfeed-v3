import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import type { Article } from "@mintfeed/shared";

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];

  const { data: article } = useQuery({
    queryKey: ["article", id],
    queryFn: () => api.get(`api/v1/feed/${id}`).json<Article>(),
    enabled: !!id,
  });

  if (!article) return null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={themeColors.text} />
        </Pressable>
        <Pressable onPress={() => Linking.openURL(article.sourceUrl)}>
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
      >
        {article.imageUrl && (
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
        )}

        <View style={[styles.badge, { borderColor: themeColors.accent }]}>
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
    backgroundColor: "rgba(0,0,0,0.6)",
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
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 16,
  },
  summary: {
    fontFamily: fonts.body.regular,
    fontSize: 16,
    lineHeight: 26,
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
