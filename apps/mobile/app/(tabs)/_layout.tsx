import { useRef, useCallback } from "react";
import { Tabs, usePathname, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts } from "@/constants/typography";
import { getTabBarHeight } from "@/components/feed/news-card-layout";
import * as haptics from "@/lib/haptics";

const TAB_ORDER = ["/", "/market", "/settings"] as const;

export default function TabLayout() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const { bottom: safeBottom } = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const navigateTab = useCallback(
    (direction: "left" | "right") => {
      const current = pathnameRef.current;
      const idx = TAB_ORDER.indexOf(current as (typeof TAB_ORDER)[number]);
      if (idx === -1) return;
      const next = direction === "right" ? idx + 1 : idx - 1;
      if (next < 0 || next >= TAB_ORDER.length) return;
      haptics.selection();
      router.navigate(TAB_ORDER[next] as any);
    },
    [router],
  );

  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => navigateTab("right"))
    .runOnJS(true);

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => navigateTab("left"))
    .runOnJS(true);

  const composedGesture = Gesture.Race(flingLeft, flingRight);

  return (
    <GestureDetector gesture={composedGesture}>
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: theme === "light" ? "#555555" : themeColors.textMuted,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopWidth: 0.5,
          borderTopColor: themeColors.border,
          position: "absolute",
          elevation: 0,
          height: getTabBarHeight(safeBottom),
          paddingTop: 8,
          paddingBottom: safeBottom + 8,
        },
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.background }]} />
        ),
        tabBarLabelStyle: {
          fontFamily: fonts.mono.regular,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: "Market",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
    </GestureDetector>
  );
}
