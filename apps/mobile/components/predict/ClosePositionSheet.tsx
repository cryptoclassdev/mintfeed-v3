import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import * as haptics from "@/lib/haptics";
import type { PredictionPosition } from "@mintfeed/shared";

type ProgressState = "idle" | "signing" | "broadcasting" | "confirming";

interface ClosePositionSheetProps {
  visible: boolean;
  onDismiss: () => void;
  position: PredictionPosition;
  contracts: number;
  costBasis: number;
  currentValue: number;
  pnl: number;
  pnlPercent: string;
  onConfirm: () => void;
  progressState: ProgressState;
  isLoading: boolean;
  lastError: { message: string; retryable: boolean } | null;
  onRetry: () => void;
}

const DURATION = 300;
const EASING_OUT = Easing.out(Easing.cubic);

export function ClosePositionSheet({
  visible,
  onDismiss,
  position,
  contracts,
  costBasis,
  currentValue,
  pnl,
  pnlPercent,
  onConfirm,
  progressState,
  isLoading,
  lastError,
  onRetry,
}: ClosePositionSheetProps) {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const { height: screenHeight } = useWindowDimensions();

  const overlayOpacity = useSharedValue(0);
  const translateY = useSharedValue(screenHeight);

  const isProfitable = pnl >= 0;
  const isProcessing = progressState !== "idle";

  useEffect(() => {
    if (visible) {
      haptics.lightImpact();
      overlayOpacity.value = withTiming(1, { duration: DURATION, easing: EASING_OUT });
      translateY.value = withTiming(0, { duration: DURATION, easing: EASING_OUT });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 250, easing: EASING_OUT });
      translateY.value = withTiming(screenHeight, { duration: 250, easing: EASING_OUT });
    }
  }, [visible, overlayOpacity, translateY, screenHeight]);

  const handleDismiss = () => {
    if (isProcessing) return;
    overlayOpacity.value = withTiming(0, { duration: 250, easing: EASING_OUT });
    translateY.value = withTiming(screenHeight, { duration: 250, easing: EASING_OUT }, () => {
      runOnJS(onDismiss)();
    });
  };

  const handleConfirm = () => {
    haptics.mediumImpact();
    onConfirm();
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      {/* Overlay */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} disabled={isProcessing} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.cardBorder,
          },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: themeColors.textFaint }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Close Position
          </Text>
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
          >
            <Ionicons name="close" size={20} color={themeColors.textMuted} />
          </Pressable>
        </View>

        {/* Market title */}
        <Text
          style={[styles.marketTitle, { color: themeColors.textSecondary }]}
          numberOfLines={2}
        >
          {position.market?.title ?? "Unknown Market"}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
              SIDE
            </Text>
            <View style={styles.sideChip}>
              <View
                style={[
                  styles.sideDot,
                  {
                    backgroundColor: position.isYes
                      ? themeColors.positive
                      : themeColors.negative,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statValue,
                  {
                    color: position.isYes
                      ? themeColors.positive
                      : themeColors.negative,
                  },
                ]}
              >
                {position.isYes ? "YES" : "NO"}
              </Text>
            </View>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
              SHARES
            </Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              {contracts}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
              COST
            </Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              ${costBasis.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.stat, { alignItems: "flex-end" }]}>
            <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
              VALUE
            </Text>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              ${currentValue.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* P&L row */}
        <View
          style={[
            styles.pnlRow,
            {
              backgroundColor: isProfitable
                ? themeColors.positive + "10"
                : themeColors.negative + "10",
            },
          ]}
        >
          <Ionicons
            name={isProfitable ? "trending-up" : "trending-down"}
            size={16}
            color={isProfitable ? themeColors.positive : themeColors.negative}
          />
          <Text
            style={[
              styles.pnlText,
              {
                color: isProfitable ? themeColors.positive : themeColors.negative,
              },
            ]}
          >
            {isProfitable ? "+" : ""}${pnl.toFixed(2)} ({isProfitable ? "+" : ""}
            {pnlPercent}%)
          </Text>
        </View>

        {/* Progress state */}
        {isProcessing && (
          <View style={styles.progressRow}>
            <ActivityIndicator size="small" color={themeColors.accent} />
            <Text style={[styles.progressText, { color: themeColors.textMuted }]}>
              {progressState === "signing" && "Signing transaction..."}
              {progressState === "broadcasting" && "Broadcasting..."}
              {progressState === "confirming" && "Confirming..."}
            </Text>
          </View>
        )}

        {/* Error + Retry */}
        {lastError && !isProcessing && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle" size={14} color={themeColors.negative} />
            <Text
              style={[styles.errorText, { color: themeColors.negative }]}
              numberOfLines={2}
            >
              {lastError.message}
            </Text>
            {lastError.retryable && (
              <Pressable
                onPress={onRetry}
                style={[styles.retryChip, { borderColor: themeColors.accent }]}
                accessibilityRole="button"
                accessibilityLabel="Retry transaction"
              >
                <Text style={[styles.retryText, { color: themeColors.accent }]}>
                  RETRY
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Action buttons */}
        {!isProcessing && (
          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, { borderColor: themeColors.border }]}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelText, { color: themeColors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              style={[styles.closeButton, { backgroundColor: themeColors.negative }]}
              onPress={handleConfirm}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Confirm close position"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.closeButtonText}>Close Position</Text>
              )}
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.lg,
  },
  marketTitle: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stat: {
    gap: 2,
  },
  statLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: 9,
    letterSpacing: letterSpacing.wide,
  },
  statValue: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.sm,
  },
  sideChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pnlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderCurve: "continuous",
  },
  pnlText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.sm,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  progressText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.xs,
    flex: 1,
  },
  retryChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retryText: {
    fontFamily: fonts.mono.bold,
    fontSize: 9,
    letterSpacing: letterSpacing.wide,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 10,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  cancelText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
  },
  closeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 10,
    borderCurve: "continuous",
  },
  closeButtonText: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.sm,
    color: "#ffffff",
  },
});
