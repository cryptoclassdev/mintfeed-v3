import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "@/lib/store";
import { mwaAuthorize } from "@/lib/wallet-adapter";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { usePredictionMarketDetail, usePredictionOrderbook } from "@/hooks/usePredictionMarket";
import { useCreateOrder } from "@/hooks/usePredictionTrading";
import { microToUsd, usdToMicro, USDC_MINT } from "@mintfeed/shared";

export default function MarketSheet() {
  const { id: marketId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const walletAddress = useAppStore((s) => s.walletAddress);
  const connectWallet = useAppStore((s) => s.connectWallet);
  const themeColors = colors[theme];

  const { data: market, isLoading: marketLoading } = usePredictionMarketDetail(marketId);
  const { data: orderbook } = usePredictionOrderbook(marketId);
  const createOrder = useCreateOrder();

  const [selectedSide, setSelectedSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");

  const yesPrice = market ? microToUsd(market.pricing.buyYesPriceUsd) : 0;
  const noPrice = market ? microToUsd(market.pricing.buyNoPriceUsd) : 0;
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  const estimatedShares = useMemo(() => {
    const usd = parseFloat(amount);
    if (!usd || usd <= 0) return 0;
    const price = selectedSide === "yes" ? yesPrice : noPrice;
    if (price <= 0) return 0;
    return Math.floor(usd / price);
  }, [amount, selectedSide, yesPrice, noPrice]);

  const handleConnectWallet = useCallback(async () => {
    try {
      const { address, authToken } = await mwaAuthorize();
      connectWallet(address, authToken);
    } catch (err) {
      Alert.alert("Wallet Error", String(err));
    }
  }, [connectWallet]);

  const handlePlaceBet = useCallback(async () => {
    if (!walletAddress || !marketId) return;
    const usd = parseFloat(amount);
    if (!usd || usd <= 0) {
      Alert.alert("Invalid amount", "Enter an amount to bet.");
      return;
    }

    try {
      await createOrder.mutateAsync({
        ownerPubkey: walletAddress,
        marketId,
        isYes: selectedSide === "yes",
        isBuy: true,
        depositAmount: usdToMicro(usd),
        depositMint: USDC_MINT,
      });
      Alert.alert("Bet Placed", `Your ${selectedSide.toUpperCase()} bet was submitted.`);
      setAmount("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Trade Failed", message);
    }
  }, [walletAddress, marketId, amount, selectedSide, createOrder]);

  // Orderbook data
  const orderbookRows = useMemo(() => {
    if (!orderbook) return [];
    const yBids = (orderbook.yes_dollars ?? []).slice(0, 5);
    const nBids = (orderbook.no_dollars ?? []).slice(0, 5);
    const maxLen = Math.max(yBids.length, nBids.length);
    const rows: Array<{ yQty: number; yPrice: string; nPrice: string; nQty: number }> = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        yQty: yBids[i]?.[1] ?? 0,
        yPrice: yBids[i]?.[0] ?? "",
        nPrice: nBids[i]?.[0] ?? "",
        nQty: nBids[i]?.[1] ?? 0,
      });
    }
    return rows;
  }, [orderbook]);

  if (marketLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.accentMint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={24} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
          {market?.metadata.title ?? "Market"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* YES / NO probabilities */}
        <View style={styles.probRow}>
          <Pressable
            style={[
              styles.probCard,
              { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
              selectedSide === "yes" && { borderColor: themeColors.positive, borderWidth: 2 },
            ]}
            onPress={() => setSelectedSide("yes")}
          >
            <Text style={[styles.probLabel, { color: themeColors.positive }]}>YES</Text>
            <Text style={[styles.probValue, { color: themeColors.positive }]}>{yesPercent}%</Text>
          </Pressable>
          <Pressable
            style={[
              styles.probCard,
              { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
              selectedSide === "no" && { borderColor: themeColors.negative, borderWidth: 2 },
            ]}
            onPress={() => setSelectedSide("no")}
          >
            <Text style={[styles.probLabel, { color: themeColors.negative }]}>NO</Text>
            <Text style={[styles.probValue, { color: themeColors.negative }]}>{noPercent}%</Text>
          </Pressable>
        </View>

        {/* Probability bar */}
        <View style={styles.fullBar}>
          <View style={[styles.fullBarYes, { flex: yesPercent || 1, backgroundColor: themeColors.positive }]} />
          <View style={[styles.fullBarNo, { flex: noPercent || 1, backgroundColor: themeColors.negative }]} />
        </View>

        {/* Orderbook */}
        {orderbookRows.length > 0 && (
          <View style={[styles.orderbookSection, { backgroundColor: themeColors.card }]}>
            <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>ORDERBOOK</Text>
            <View style={styles.orderbookHeader}>
              <Text style={[styles.obHeaderText, { color: themeColors.positive }]}>YES BIDS</Text>
              <Text style={[styles.obHeaderText, { color: themeColors.negative, textAlign: "right" }]}>
                NO BIDS
              </Text>
            </View>
            {orderbookRows.map((row, i) => (
              <View key={i} style={styles.orderbookRow}>
                <Text style={[styles.obQty, { color: themeColors.text }]}>{row.yQty || ""}</Text>
                <Text style={[styles.obPrice, { color: themeColors.positive }]}>{row.yPrice || ""}</Text>
                <Text style={[styles.obPrice, { color: themeColors.negative }]}>{row.nPrice || ""}</Text>
                <Text style={[styles.obQty, { color: themeColors.text, textAlign: "right" }]}>
                  {row.nQty || ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Trade section — pinned to bottom */}
      <View style={[styles.tradeSection, { borderTopColor: themeColors.border }]}>
        {walletAddress ? (
          <>
            <View style={styles.tradeRow}>
              <View
                style={[styles.amountInput, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
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
                  opacity: createOrder.isPending || !amount ? 0.5 : 1,
                },
              ]}
              onPress={handlePlaceBet}
              disabled={createOrder.isPending || !amount}
            >
              {createOrder.isPending ? (
                <ActivityIndicator size="small" color={themeColors.background} />
              ) : (
                <Text style={[styles.betButtonText, { color: themeColors.background }]}>
                  Buy {selectedSide.toUpperCase()} · {selectedSide === "yes" ? yesPercent : noPercent}¢
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[styles.connectButton, { borderColor: themeColors.accentMint }]}
            onPress={handleConnectWallet}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.body.bold,
    fontSize: fontSize.base,
    textAlign: "center",
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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

  // Orderbook
  orderbookSection: {
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    letterSpacing: letterSpacing.wide,
    marginBottom: 8,
  },
  orderbookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  obHeaderText: {
    fontFamily: fonts.mono.bold,
    fontSize: 10,
    letterSpacing: letterSpacing.wide,
  },
  orderbookRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  obQty: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    width: 60,
  },
  obPrice: {
    fontFamily: fonts.mono.regular,
    fontSize: 11,
    width: 50,
    textAlign: "center",
  },

  // Trade section
  tradeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
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
