import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { onToast, type ToastMessage } from "@/lib/toast";

const TOAST_DURATION = 300;
const EASING = Easing.out(Easing.cubic);

const VARIANT_CONFIG = {
  success: { icon: "checkmark-circle" as const, colorKey: "positive" as const },
  error: { icon: "alert-circle" as const, colorKey: "negative" as const },
  info: { icon: "information-circle" as const, colorKey: "accent" as const },
};

export function ToastProvider() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastMessage | null>(null);
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-120, { duration: TOAST_DURATION, easing: EASING });
    opacity.value = withTiming(0, { duration: TOAST_DURATION, easing: EASING }, () => {
      runOnJS(setCurrent)(null);
    });
  }, [translateY, opacity]);

  const show = useCallback(
    (toast: ToastMessage) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      setCurrent(toast);
      translateY.value = -120;
      opacity.value = 0;
      translateY.value = withTiming(0, { duration: TOAST_DURATION, easing: EASING });
      opacity.value = withTiming(1, { duration: TOAST_DURATION, easing: EASING });
      dismissTimer.current = setTimeout(dismiss, toast.duration ?? 3000);
    },
    [translateY, opacity, dismiss],
  );

  useEffect(() => onToast(show), [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!current) return null;

  const config = VARIANT_CONFIG[current.variant];
  const variantColor = themeColors[config.colorKey];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, backgroundColor: themeColors.card, borderColor: variantColor + "40" },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable style={styles.content} onPress={dismiss}>
        <Ionicons name={config.icon} size={20} color={variantColor} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {current.title}
          </Text>
          {current.message && (
            <Text style={[styles.message, { color: themeColors.textSecondary }]} numberOfLines={2}>
              {current.message}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 0.5,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
  },
  message: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
  },
});
