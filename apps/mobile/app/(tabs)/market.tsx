import { memo, useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useMarket } from "@/hooks/useMarket";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
import { FearGreedCard } from "@/components/market/FearGreedCard";
import { Ionicons } from "@expo/vector-icons";
import type { MarketCoin } from "@mintfeed/shared";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const smallPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 6,
});

function formatPrice(price: number): string {
  return price < 1
    ? smallPriceFormatter.format(price)
    : priceFormatter.format(price);
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toFixed(0)}`;
}

type RankedCoin = MarketCoin & { rank: number };

interface CoinRowProps {
  item: RankedCoin;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  positiveColor: string;
  negativeColor: string;
  positiveTint: string;
  negativeTint: string;
}

const CoinRow = memo(function CoinRow({
  item,
  borderColor,
  textColor,
  mutedColor,
  positiveColor,
  negativeColor,
  positiveTint,
  negativeTint,
}: CoinRowProps) {
  const isPositive = item.priceChange24h >= 0;

  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <Text style={[styles.rank, { color: mutedColor }]}>
        {item.rank}
      </Text>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.coinIcon}
          accessibilityLabel={`${item.name} icon`}
        />
      ) : null}
      <View style={styles.coinInfo}>
        <Text style={[styles.coinName, { color: textColor }]}>
          {item.name}
        </Text>
        <Text style={[styles.coinMeta, { color: mutedColor }]}>
          {item.symbol.toUpperCase()} // {formatMarketCap(item.marketCap)}
        </Text>
      </View>
      <View style={styles.priceInfo}>
        <Text style={[styles.price, { color: textColor }]}>
          {formatPrice(item.currentPrice)}
        </Text>
        <View
          style={[
            styles.changeBadge,
            { backgroundColor: isPositive ? positiveTint : negativeTint },
          ]}
        >
          <Text
            style={[
              styles.change,
              { color: isPositive ? positiveColor : negativeColor },
            ]}
          >
            {isPositive ? "+" : ""}
            {item.priceChange24h.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
});

const EMPTY_COINS: MarketCoin[] = [];

const keyExtractor = (item: RankedCoin) => item.id;

export default function MarketScreen() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const { data, isLoading, isError, refetch } = useMarket();
  const [searchQuery, setSearchQuery] = useState("");

  const rankedCoins: RankedCoin[] = useMemo(() => {
    const coins = data?.data ?? EMPTY_COINS;
    return coins.map((coin, i) => ({ ...coin, rank: i + 1 }));
  }, [data?.data]);

  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return rankedCoins;
    const query = searchQuery.toLowerCase();
    return rankedCoins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query),
    );
  }, [rankedCoins, searchQuery]);

  const renderItem = useCallback(
    ({ item }: { item: RankedCoin }) => (
      <CoinRow
        item={item}
        borderColor={themeColors.border}
        textColor={themeColors.text}
        mutedColor={themeColors.textMuted}
        positiveColor={themeColors.positive}
        negativeColor={themeColors.negative}
        positiveTint={themeColors.positiveTint}
        negativeTint={themeColors.negativeTint}
      />
    ),
    [themeColors.border, themeColors.text, themeColors.textMuted, themeColors.positive, themeColors.negative, themeColors.positiveTint, themeColors.negativeTint]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]} accessibilityRole="header">Market</Text>
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: themeColors.positive }]} />
          <Text style={[styles.subtitle, { color: themeColors.positive }]}>
            Live
          </Text>
        </View>
      </View>
      <View style={[styles.searchContainer, { borderColor: themeColors.cardBorder }]}>
        <Ionicons name="search-outline" size={16} color={themeColors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search tokens..."
          placeholderTextColor={themeColors.textFaint}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={themeColors.textMuted} />
          </Pressable>
        )}
      </View>
      <FlashList
        data={filteredCoins}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={styles.list}
        ListHeaderComponent={searchQuery ? undefined : FearGreedCard}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                {isError ? "FAILED TO LOAD PRICES" : "NO MARKET DATA"}
              </Text>
              {isError && (
                <Pressable
                  onPress={() => refetch()}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading market data"
                  style={[styles.retryButton, { borderColor: themeColors.accent }]}
                >
                  <Text style={[styles.retryText, { color: themeColors.accent }]}>TAP TO RETRY</Text>
                </Pressable>
              )}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontFamily: fonts.brand.extraBold,
    fontSize: fontSize.xxl,
  },
  subtitle: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 0.5,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    padding: 0,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  rank: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    minWidth: 28,
    textAlign: "right",
  },
  coinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontFamily: fonts.body.semiBold,
    fontSize: fontSize.base,
  },
  coinMeta: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xxs,
    marginTop: 2,
    letterSpacing: letterSpacing.wide,
  },
  priceInfo: {
    alignItems: "flex-end",
  },
  price: {
    fontFamily: fonts.mono.bold,
    fontSize: fontSize.base,
  },
  changeBadge: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderCurve: "continuous",
  },
  change: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  retryText: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
