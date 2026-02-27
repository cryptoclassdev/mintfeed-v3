import { View, StyleSheet, Pressable, Text } from "react-native";
import { SwipeFeed } from "@/components/feed/SwipeFeed";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";

const CATEGORIES = ["all", "crypto", "ai"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  all: "ALL",
  crypto: "CRYPTO",
  ai: "AI",
};

export default function FeedScreen() {
  const theme = useAppStore((s) => s.theme);
  const selectedCategory = useAppStore((s) => s.selectedCategory);
  const setCategory = useAppStore((s) => s.setCategory);
  const themeColors = colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <SwipeFeed />
      <View style={styles.categoryBar}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.chip,
                {
                  borderColor: isActive
                    ? themeColors.accent
                    : themeColors.border,
                  backgroundColor: isActive
                    ? "rgba(230, 0, 0, 0.15)"
                    : "rgba(0, 0, 0, 0.6)",
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isActive ? themeColors.accent : themeColors.textMuted,
                  },
                ]}
              >
                {CATEGORY_LABELS[cat]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryBar: {
    position: "absolute",
    top: 56,
    right: 16,
    flexDirection: "row",
    gap: 8,
    zIndex: 30,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    textTransform: "uppercase",
    letterSpacing: letterSpacing.wide,
  },
});
