import { memo, useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/store";
import { showToast } from "@/lib/toast";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { useClosePosition, useClaimPosition } from "@/hooks/usePredictionTrading";
import { microToUsd } from "@mintfeed/shared";
import type { PredictionPosition } from "@mintfeed/shared";

interface PositionCardProps {
  position: PredictionPosition;
}

export const PositionCard = memo(function PositionCard({
  position,
}: PositionCardProps) {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];

  const closePos = useClosePosition();
  const claimPos = useClaimPosition();
  const [actionLoading, setActionLoading] = useState<"close" | "claim" | null>(
    null,
  );

  const contracts = Number(position.contracts);
  const costBasis = microToUsd(position.costBasisUsd);
  const pnl = microToUsd(position.pnlUsd);
  const pnlPercent =
    costBasis > 0 ? ((pnl / costBasis) * 100).toFixed(1) : "0.0";
  const isProfitable = pnl >= 0;
  const currentValue = costBasis + pnl;

  const marketTitle = position.market?.title ?? "Unknown Market";
  const marketStatus = position.market?.status ?? "open";
  const isResolved = marketStatus === "closed" || marketStatus === "cancelled";

  const currentPrice =
    position.market?.pricing
      ? microToUsd(
          position.isYes
            ? position.market.pricing.buyYesPriceUsd
            : position.market.pricing.buyNoPriceUsd,
        )
      : null;
  const pricePercent = currentPrice !== null ? Math.round(currentPrice * 100) : null;

  const handleClose = useCallback(async () => {
    Alert.alert(
      "Close Position",
      `Sell ${contracts} ${position.isYes ? "YES" : "NO"} shares?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: async () => {
            setActionLoading("close");
            try {
              await closePos.mutateAsync({
                positionPubkey: position.pubkey,
                ownerPubkey: position.ownerPubkey,
              });
              showToast("success", "Position Closed", "Your position has been sold.");
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              showToast("error", "Failed", msg);
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  }, [closePos, position, contracts]);

  const handleClaim = useCallback(async () => {
    setActionLoading("claim");
    try {
      await claimPos.mutateAsync({
        positionPubkey: position.pubkey,
        ownerPubkey: position.ownerPubkey,
      });
      showToast("success", "Claimed!", "Winnings have been sent to your wallet.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast("error", "Claim Failed", msg);
    } finally {
      setActionLoading(null);
    }
  }, [claimPos, position]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.card,
          borderColor: themeColors.cardBorder,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${marketTitle}, ${position.isYes ? "Yes" : "No"} side, ${contracts} shares, P&L ${isProfitable ? "plus" : "minus"} ${Math.abs(pnl).toFixed(2)} dollars`}
    >
      {/* Title + Status */}
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: themeColors.text }]}
          numberOfLines={2}
        >
          {marketTitle}
        </Text>
        {isResolved && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: position.claimable
                  ? themeColors.positive + "20"
                  : themeColors.textFaint + "30",
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: position.claimable
                    ? themeColors.positive
                    : themeColors.textMuted,
                },
              ]}
            >
              {position.claimable ? "WON" : "RESOLVED"}
            </Text>
          </View>
        )}
      </View>

      {/* Side + Shares / Cost + Current Value */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
            Side
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
            Shares
          </Text>
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            {contracts}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
            Cost
          </Text>
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            ${costBasis.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.stat, { alignItems: "flex-end" }]}>
          <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>
            Value
          </Text>
          <Text style={[styles.statValue, { color: themeColors.text }]}>
            ${currentValue.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* P&L Row */}
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
        {pricePercent !== null && !isResolved && (
          <Text style={[styles.priceHint, { color: themeColors.textMuted }]}>
            {pricePercent}¢ → $1.00
          </Text>
        )}
      </View>

      {/* Progress bar */}
      {pricePercent !== null && !isResolved && (
        <View style={[styles.progressTrack, { backgroundColor: themeColors.trackBg }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${pricePercent}%`,
                backgroundColor: position.isYes
                  ? themeColors.positive
                  : themeColors.negative,
              },
            ]}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!isResolved && (
          <Pressable
            style={[
              styles.actionButton,
              { borderColor: themeColors.negative },
            ]}
            onPress={handleClose}
            disabled={actionLoading !== null}
            accessibilityRole="button"
            accessibilityLabel="Close position"
          >
            {actionLoading === "close" ? (
              <ActivityIndicator size="small" color={themeColors.negative} />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={16}
                  color={themeColors.negative}
                />
                <Text
                  style={[styles.actionText, { color: themeColors.negative }]}
                >
                  Close Position
                </Text>
              </>
            )}
          </Pressable>
        )}
        {position.claimable && (
          <Pressable
            style={[
              styles.actionButton,
              styles.claimButton,
              { backgroundColor: themeColors.positive },
            ]}
            onPress={handleClaim}
            disabled={actionLoading !== null}
            accessibilityRole="button"
            accessibilityLabel="Claim winnings"
          >
            {actionLoading === "claim" ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Ionicons name="trophy-outline" size={16} color="#000000" />
                <Text style={[styles.actionText, { color: "#000000" }]}>
                  Claim Winnings
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: 0.5,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
    lineHeight: 20,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: "continuous",
  },
  statusText: {
    fontFamily: fonts.mono.bold,
    fontSize: 9,
    letterSpacing: letterSpacing.wide,
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
    textTransform: "uppercase",
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
  priceHint: {
    fontFamily: fonts.mono.regular,
    fontSize: 10,
    marginLeft: "auto",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 10,
    borderCurve: "continuous",
    borderWidth: 1,
  },
  claimButton: {
    borderWidth: 0,
  },
  actionText: {
    fontFamily: fonts.mono.bold,
    fontSize: 10,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
  },
});
