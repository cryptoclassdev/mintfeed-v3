import { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { usePredictionMarketDetail } from "@/hooks/usePredictionMarket";
import { useCreateOrder, useTradingStatus } from "@/hooks/usePredictionTrading";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { getUsdcBalanceError } from "@/lib/balance";
import { getMinimumTradeUsdFromError } from "@/lib/prediction-errors";
import {
  microToUsd,
  usdToMicro,
  USDC_MINT,
  validateTradeAmount,
  parseTradeAmount,
  formatResolutionCountdown,
  computeLiquiditySpread,
  MINIMUM_TRADE_USD,
} from "@midnight/shared";
import { showToast } from "@/lib/toast";
import * as haptics from "@/lib/haptics";
import { closeModal } from "@/lib/navigation";
import { buildResolutionRulePreview, formatResolveDateTime } from "@/lib/market-sheet-utils";

const STATUS_COLORS = {
  open: "#00ff66",
  closed: "#E60000",
  cancelled: "#888888",
} as const;

export default function MarketSheet() {
  const { id: marketId, question } = useLocalSearchParams<{ id: string; question?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const theme = useAppStore((s) => s.theme);
  const { account } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;
  const { connect } = useMobileWallet();
  const themeColors = colors[theme];

  const {
    data: cachedMarket,
    isLoading: cachedMarketLoading,
  } = usePredictionMarketDetail(marketId);
  const {
    data: freshMarket,
    isLoading: freshMarketLoading,
    isError: freshMarketError,
  } = usePredictionMarketDetail(marketId, {
    fresh: true,
  });
  const market = freshMarket ?? cachedMarket;
  const marketLoading = !market && (cachedMarketLoading || freshMarketLoading);
  const hasFreshQuote = !!freshMarket;
  const quoteRefreshBlocked = !!market && !hasFreshQuote;
  const createOrder = useCreateOrder();
  const { data: tradingStatus } = useTradingStatus();
  const { data: walletBalances } = useWalletBalance(walletAddress);
  const serverMinimumTradeUsd = tradingStatus?.minimum_order_usd ?? MINIMUM_TRADE_USD;

  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [showFullRules, setShowFullRules] = useState(false);
  const [effectiveMinimumTradeUsd, setEffectiveMinimumTradeUsd] = useState(serverMinimumTradeUsd);

  const yesPrice = market ? microToUsd(market.pricing.buyYesPriceUsd) : 0;
  const noPrice = market ? microToUsd(market.pricing.buyNoPriceUsd) : 0;
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  const tradeValidation = useMemo(
    () => validateTradeAmount(amount, effectiveMinimumTradeUsd),
    [amount, effectiveMinimumTradeUsd],
  );
  const resolutionPreview = useMemo(
    () => buildResolutionRulePreview(market?.metadata?.rulesPrimary),
    [market?.metadata?.rulesPrimary],
  );

  const balanceWarning = useMemo(() => {
    if (!walletBalances) return null;
    const usd = parseTradeAmount(amount);
    if (!usd || usd <= 0) return null;
    return getUsdcBalanceError(walletBalances, Number(usdToMicro(usd)));
  }, [walletBalances, amount]);

  const usdcBalance = walletBalances
    ? (walletBalances.usdcMicroAmount / 1_000_000).toFixed(2)
    : null;

  const estimatedShares = useMemo(() => {
    const usd = parseTradeAmount(amount);
    if (!usd || usd <= 0) return 0;
    const price = selectedSide === "yes" ? yesPrice : noPrice;
    if (price <= 0) return 0;
    return Math.floor(usd / price);
  }, [amount, selectedSide, yesPrice, noPrice]);

  useEffect(() => {
    setEffectiveMinimumTradeUsd(serverMinimumTradeUsd);
  }, [marketId, serverMinimumTradeUsd]);

  useEffect(() => {
    setEffectiveMinimumTradeUsd((currentMinimum) => Math.max(currentMinimum, serverMinimumTradeUsd));
  }, [serverMinimumTradeUsd]);

  const handleClose = useCallback(() => {
    closeModal(router);
  }, [router]);

  const handleConnectWallet = useCallback(async () => {
    haptics.mediumImpact();
    try {
      await connect();
    } catch {
      // user cancelled or connection failed — handled by MWA
    }
  }, [connect]);

  const handlePlaceBet = useCallback(async () => {
    if (!walletAddress || !marketId) return;
    const validation = validateTradeAmount(amount, effectiveMinimumTradeUsd);
    if (!validation.valid) {
      haptics.warning();
      const msg = validation.error === "BELOW_MINIMUM"
        ? `Minimum bet: >$${effectiveMinimumTradeUsd.toFixed(2)}`
        : "Enter a valid amount.";
      showToast("error", "Invalid amount", msg);
      return;
    }

    // Force a balance refresh before placing the bet so stale "insufficient"
    // state can't block the mutation when the user has actually deposited.
    await queryClient.invalidateQueries({
      queryKey: ["wallet-balance", walletAddress],
    });

    const usd = parseTradeAmount(amount)!;
    try {
      const result = await createOrder.mutateAsync({
        ownerPubkey: walletAddress,
        marketId,
        isYes: selectedSide === "yes",
        isBuy: true,
        depositAmount: usdToMicro(usd),
        depositMint: USDC_MINT,
      });
      haptics.success();
      if (result.verification === "uncertain") {
        showToast(
          "info",
          "Checking Trade Status",
          `Your ${selectedSide.toUpperCase()} bet may have landed. We're refreshing your positions now.`,
        );
      } else if (result.status === "pending") {
        showToast("info", "Transaction Pending", `Your ${selectedSide.toUpperCase()} bet was submitted.`);
      } else {
        showToast("success", "Bet Placed", `Your ${selectedSide.toUpperCase()} bet was confirmed.`);
      }
      setAmount("");
    } catch (err: unknown) {
      haptics.error();
      const minimumTradeUsd = getMinimumTradeUsdFromError(err);
      if (minimumTradeUsd && minimumTradeUsd > effectiveMinimumTradeUsd) {
        setEffectiveMinimumTradeUsd(minimumTradeUsd);
      }
      const message = minimumTradeUsd
        ? `Minimum bet for this market is >$${minimumTradeUsd.toFixed(2)}.`
        : err instanceof Error
          ? err.message
          : String(err);
      showToast("error", "Trade Failed", message);
    }
  }, [
    walletAddress,
    marketId,
    amount,
    selectedSide,
    createOrder,
    effectiveMinimumTradeUsd,
    queryClient,
  ]);

  const isTradingPaused = tradingStatus?.trading_active === false;
  const hasAmountInput = amount.length > 0;
  const isAmountInvalid = hasAmountInput && !tradeValidation.valid;

  const buyButtonDisabled =
    !tradeValidation.valid ||
    createOrder.isPending ||
    isTradingPaused ||
    !!balanceWarning ||
    quoteRefreshBlocked;

  const buyButtonText = useMemo(() => {
    if (isTradingPaused) return "Trading Paused";
    if (quoteRefreshBlocked) return freshMarketError ? "Quote unavailable" : "Refreshing quote...";
    if (!hasAmountInput || tradeValidation.error === "INVALID_NUMBER") {
      return `Enter >$${effectiveMinimumTradeUsd} to bet`;
    }
    if (tradeValidation.error === "BELOW_MINIMUM") {
      return `Enter >$${effectiveMinimumTradeUsd} to bet`;
    }
    return `Buy ${selectedSide.toUpperCase()} \u00B7 ${selectedSide === "yes" ? yesPercent : noPercent}\u00A2`;
  }, [
    effectiveMinimumTradeUsd,
    freshMarketError,
    hasAmountInput,
    isTradingPaused,
    noPercent,
    quoteRefreshBlocked,
    selectedSide,
    tradeValidation,
    yesPercent,
  ]);

  const isBinary = market && yesPrice > 0 && noPrice > 0;

  // Only show the full-screen spinner when there's no data at all — with the
  // pre-seeded cache from SwipeBetCard, market is populated instantly and we
  // paint the sheet while the background refetch resolves.
  if (marketLoading && !market) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (market && !isBinary) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={themeColors.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={32} color={themeColors.textMuted} />
          <Text style={[styles.emptyText, { color: themeColors.textMuted, marginTop: 12 }]}>
            Market unavailable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const marketTitle = question ?? market?.metadata?.title ?? "Market";
  const marketStatus = market?.status ?? "open";
  const statusColor = STATUS_COLORS[marketStatus] ?? STATUS_COLORS.open;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header — close button only */}
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close market sheet"
          style={styles.headerButton}
        >
          <Ionicons name="close" size={24} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large headline + status badge */}
        <View style={styles.titleSection}>
          <Text style={[styles.marketTitle, { color: themeColors.text }]}>
            {marketTitle}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {marketStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* YES / NO probabilities */}
        <View style={styles.probRow}>
          <Pressable
            style={[
              styles.probCard,
              { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
              selectedSide === "yes" && { borderColor: themeColors.positive, borderWidth: 2 },
            ]}
            onPress={() => { haptics.selection(); setSelectedSide("yes"); }}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedSide === "yes" }}
            accessibilityLabel={`Yes at ${yesPercent} percent`}
          >
            <Text style={[styles.probLabel, { color: themeColors.positive }]}>YES</Text>
            <Text style={[styles.probValue, { color: themeColors.positive }]} maxFontSizeMultiplier={1.3}>{yesPercent}%</Text>
          </Pressable>
          <Pressable
            style={[
              styles.probCard,
              { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
              selectedSide === "no" && { borderColor: themeColors.negative, borderWidth: 2 },
            ]}
            onPress={() => { haptics.selection(); setSelectedSide("no"); }}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedSide === "no" }}
            accessibilityLabel={`No at ${noPercent} percent`}
          >
            <Text style={[styles.probLabel, { color: themeColors.negative }]}>NO</Text>
            <Text style={[styles.probValue, { color: themeColors.negative }]} maxFontSizeMultiplier={1.3}>{noPercent}%</Text>
          </Pressable>
        </View>

        {/* Probability bar */}
        <View style={styles.fullBar}>
          <View style={[styles.fullBarYes, { flex: yesPercent || 1, backgroundColor: themeColors.positive }]} />
          <View style={[styles.fullBarNo, { flex: noPercent || 1, backgroundColor: themeColors.negative }]} />
        </View>

        {resolutionPreview.text && (
          <View
            style={[
              styles.resolutionSection,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.cardBorder,
              },
            ]}
          >
            <View style={styles.resolutionHeader}>
              <Ionicons name="document-text-outline" size={14} color={themeColors.textMuted} />
              <Text style={[styles.resolutionLabel, { color: themeColors.textMuted }]}>
                RESOLUTION
              </Text>
            </View>
            <Text style={[styles.resolutionText, { color: themeColors.textSecondary }]}>
              {showFullRules ? market?.metadata?.rulesPrimary?.replace(/\s+/g, " ").trim() : resolutionPreview.text}
            </Text>
            {resolutionPreview.truncated && (
              <Pressable
                onPress={() => setShowFullRules((value) => !value)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={showFullRules ? "Show less resolution criteria" : "Show full resolution criteria"}
              >
                <Text style={[styles.resolutionToggle, { color: themeColors.accent }]}>
                  {showFullRules ? "Read less" : "Read full rules"}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* TODO: Probability history chart — requires PredictionPriceSnapshot table + cron + new API endpoint */}

        {/* Resolution countdown + Volume */}
        {market && (
          <View style={styles.metaSection}>
            {market.closeTime > 0 && (
              <View style={styles.metaCard}>
                <Ionicons name="time-outline" size={14} color={themeColors.textMuted} />
                <Text style={[styles.metaCountdown, { color: themeColors.text }]}>
                  {formatResolutionCountdown(market.closeTime)}
                </Text>
                <Text style={[styles.metaDate, { color: themeColors.textMuted }]}>
                  {formatResolveDateTime(market.closeTime)}
                </Text>
              </View>
            )}
            {market.pricing.volume > 0 && (
              <View style={styles.metaCard}>
                <Ionicons name="bar-chart-outline" size={14} color={themeColors.textMuted} />
                <Text style={[styles.metaVolume, { color: themeColors.text }]}>
                  ${market.pricing.volume.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </Text>
                <Text style={[styles.metaDate, { color: themeColors.textMuted }]}>
                  VOLUME
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Liquidity spread */}
        {market && yesPrice > 0 && (
          <View style={styles.spreadRow}>
            <Text style={[styles.spreadLabel, { color: themeColors.textMuted }]}>SPREAD</Text>
            <Text style={[styles.spreadValue, { color: themeColors.text }]}>
              {(computeLiquiditySpread(market.pricing) * 100).toFixed(1)}¢
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Trade section — pinned to bottom */}
      <View style={[styles.tradeSection, { borderTopColor: themeColors.border }]}>
        {walletAddress ? (
          <>
            {/* Trading paused banner */}
            {isTradingPaused && (
              <View style={[styles.pausedBanner, { backgroundColor: themeColors.negative + "18" }]}>
                <Ionicons name="pause-circle" size={14} color={themeColors.negative} />
                <Text style={[styles.pausedText, { color: themeColors.negative }]}>
                  Trading is currently paused
                </Text>
              </View>
            )}

            <View style={styles.tradeRow}>
              <View
                style={[
                  styles.amountInput,
                  { borderColor: themeColors.border, backgroundColor: themeColors.card },
                  isAmountInvalid && { borderColor: themeColors.negative },
                ]}
              >
                <Text style={[styles.dollarSign, { color: themeColors.textMuted }]}>$</Text>
                <TextInput
                  style={[styles.amountField, { color: themeColors.text }]}
                  placeholder="0.00"
                  placeholderTextColor={themeColors.textMuted}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <Text style={[styles.usdcLabel, { color: themeColors.textMuted }]}>USDC</Text>
              </View>
            </View>

            {/* Balance display */}
            {usdcBalance !== null && (
              <Text style={[styles.hintText, { color: themeColors.textMuted }]}>
                Balance: ${usdcBalance} USDC
              </Text>
            )}

            {/* Balance warning */}
            {balanceWarning && (
              <Text style={[styles.errorText, { color: themeColors.negative }]}>
                {balanceWarning}
              </Text>
            )}

            {!balanceWarning && quoteRefreshBlocked && (
              <Text
                style={[
                  styles.errorText,
                  { color: freshMarketError ? themeColors.negative : themeColors.textMuted },
                ]}
              >
                {freshMarketError
                  ? "Latest quote unavailable. Retrying..."
                  : "Refreshing latest quote before trading..."}
              </Text>
            )}

            {/* Validation error */}
            {!balanceWarning && !quoteRefreshBlocked && isAmountInvalid && tradeValidation.error === "BELOW_MINIMUM" && (
              <Text style={[styles.errorText, { color: themeColors.negative }]}>
                Minimum bet: {'>'}${effectiveMinimumTradeUsd.toFixed(2)}
              </Text>
            )}

            {/* Persistent hint */}
            <Text style={[styles.hintText, { color: themeColors.textMuted }]}>
              Min. bet: {'>'}${effectiveMinimumTradeUsd.toFixed(2)} USDC
            </Text>

            {estimatedShares > 0 && (
              <Text style={[styles.estimate, { color: themeColors.textMuted }]}>
                ~{estimatedShares} shares · Payout if correct: ${estimatedShares.toFixed(2)}
              </Text>
            )}

            <Pressable
              style={[
                styles.betButton,
                {
                  backgroundColor: selectedSide === "yes" ? themeColors.positive : themeColors.negative,
                  opacity: buyButtonDisabled ? 0.5 : 1,
                },
              ]}
              onPress={() => { haptics.heavyImpact(); handlePlaceBet(); }}
              disabled={buyButtonDisabled}
              accessibilityRole="button"
              accessibilityLabel={`Buy ${selectedSide} at ${selectedSide === "yes" ? yesPercent : noPercent} cents`}
            >
              {createOrder.isPending ? (
                <ActivityIndicator size="small" color={themeColors.background} />
              ) : (
                <Text style={[styles.betButtonText, { color: themeColors.background }]}>
                  {buyButtonText}
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.connectButton, { borderColor: themeColors.accentMint }]}
            onPress={handleConnectWallet}
            accessibilityRole="button"
            accessibilityLabel="Connect wallet to place bets"
          >
            <Ionicons name="wallet-outline" size={18} color={themeColors.accentMint} />
            <Text style={[styles.connectText, { color: themeColors.accentMint }]}>Connect Wallet to Bet</Text>
          </Pressable>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Title + status
  titleSection: {
    marginBottom: 16,
    gap: 10,
  },
  marketTitle: {
    fontFamily: fonts.brand.bold,
    fontSize: fontSize.xl,
    lineHeight: 30,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderCurve: "continuous",
  },
  statusBadgeText: {
    fontFamily: fonts.mono.bold,
    fontSize: 9,
    letterSpacing: letterSpacing.wide,
  },

  // Probability cards
  probRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  probCard: {
    flex: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 20,
    gap: 4,
  },
  probLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
  },
  probValue: {
    fontFamily: fonts.display.regular,
    fontSize: 40,
  },

  // Full-width bar
  fullBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 24,
  },
  fullBarYes: {},
  fullBarNo: {},

  resolutionSection: {
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 20,
  },
  resolutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resolutionLabel: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
  },
  resolutionText: {
    fontFamily: fonts.body.regular,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  resolutionToggle: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
    textTransform: "uppercase",
  },

  // Meta section (resolution + volume)
  metaSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  metaCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  metaCountdown: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
  },
  metaVolume: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.base,
    letterSpacing: letterSpacing.wide,
  },
  metaDate: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
  },

  // Liquidity spread
  spreadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  spreadLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
  },
  spreadValue: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
  },

  // Section shared
  sectionTitle: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    textAlign: "center",
    paddingVertical: 12,
  },

  // Trade section
  tradeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  pausedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderCurve: "continuous",
  },
  pausedText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wide,
  },
  tradeRow: {
    flexDirection: "row",
    gap: 8,
  },
  amountInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    height: 44,
    gap: 4,
  },
  dollarSign: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.base,
  },
  amountField: {
    flex: 1,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.base,
    paddingVertical: 0,
  },
  usdcLabel: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
  },
  errorText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
  },
  hintText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
  },
  estimate: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    textAlign: "center",
  },
  betButton: {
    height: 48,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  betButtonText: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderCurve: "continuous",
    borderWidth: 1.5,
    gap: 8,
  },
  connectText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
  },
});
