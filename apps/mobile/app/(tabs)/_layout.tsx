import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts } from "@/constants/typography";

export default function TabLayout() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
          position: "absolute",
          elevation: 0,
        },
        tabBarBackground: () => null,
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
  );
}
