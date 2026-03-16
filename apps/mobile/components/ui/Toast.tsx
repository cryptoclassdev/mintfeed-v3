import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as haptics from "@/lib/haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize } from "@/constants/typography";
import { onToast, type ToastMessage } from "@/lib/toast";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TOAST_DURATION = 400; // Slightly longer for smoother feel
const EASING = Easing.bezier(0.2, 0, 0, 1); // Custom easing for better feel

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
  
  // Animation values
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    // Smooth exit animation
    translateY.value = withTiming(-120, { duration: TOAST_DURATION, easing: EASING });
    opacity.value = withTiming(0, { duration: TOAST_DURATION, easing: EASING });
    scale.value = withTiming(0.9, { duration: TOAST_DURATION, easing: EASING }, () => {
      runOnJS(setCurrent)(null);
    });
  }, [translateY, opacity, scale]);

  const show = useCallback(
    (toast: ToastMessage) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      
      // Haptic feedback based on toast variant
      if (toast.variant === 'success') haptics.success();
      else if (toast.variant === 'error') haptics.error();
      else haptics.lightImpact();
      
      setCurrent(toast);
      
      // Reset values
      translateY.value = -120;
      opacity.value = 0;
      scale.value = 0.9;
      
      // Smooth enter animation with slight bounce
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: TOAST_DURATION, easing: EASING });
      scale.value = withSpring(1, { damping: 18, stiffness: 300 });
      
      dismissTimer.current = setTimeout(dismiss, toast.duration ?? 3000);
    },
    [translateY, opacity, scale, dismiss],
  );

  useEffect(() => onToast(show), [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!current) return null;

  const config = VARIANT_CONFIG[current.variant];
  const variantColor = themeColors[config.colorKey];

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          top: insets.top + 12,
          backgroundColor: themeColors.card,
          // Using shadows instead of borders for depth
          shadowColor: variantColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <AnimatedPressable 
        style={styles.content} 
        onPress={dismiss}
        hitSlop={8} // Better hit area
        accessibilityRole="button"
        accessibilityLabel={`${current.variant} notification: ${current.title}. Tap to dismiss.`}
      >
        <View style={[
          styles.iconContainer,
          {
            backgroundColor: `${variantColor}15`, // Subtle tinted background
            borderRadius: 8, // Concentric: outer 16 - padding 8 = inner 8
          }
        ]}>
          <Ionicons name={config.icon} size={18} color={variantColor} />
        </View>
        
        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.title, 
              { 
                color: themeColors.text,
                // Better text wrapping
                textAlign: 'left',
              }
            ]} 
            numberOfLines={1}
          >
            {current.title}
          </Text>
          {current.message && (
            <Text 
              style={[
                styles.message, 
                { 
                  color: themeColors.textSecondary,
                  textAlign: 'left',
                }
              ]} 
              numberOfLines={2}
            >
              {current.message}
            </Text>
          )}
        </View>

        {/* Subtle close indicator */}
        <View style={[
          styles.closeHint,
          { backgroundColor: `${themeColors.textMuted}20` }
        ]}>
          <Ionicons 
            name="close" 
            size={12} 
            color={themeColors.textMuted} 
          />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    zIndex: 9999,
    // Better backdrop blur effect simulation
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    minHeight: 56, // Minimum touch target
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  message: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  closeHint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});