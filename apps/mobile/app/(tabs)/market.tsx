import { memo, useCallback } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useMarket } from "@/hooks/useMarket";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { fonts, fontSize, letterSpacing } from "@/constants/typography";
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

interface CoinRowProps {
  item: MarketCoin;
  index: number;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  positiveColor: string;
  negativeColor: string;
}

const CoinRow = memo(function CoinRow({
  item,
  index,
  borderColor,
  textColor,
  mutedColor,
  positiveColor,
  negativeColor,
}: CoinRowProps) {
  const isPositive = item.priceChange24h >= 0;

  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <Text style={[styles.rank, { color: mutedColor }]}>
        {String(index + 1).padStart(2, "0")}
      </Text>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.coinIcon} />
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
        <Text
          style={[
            styles.change,
            {
              color: isPositive ? positiveColor : negativeColor,
            },
          ]}
        >
          {isPositive ? "+" : ""}
          {item.priceChange24h.toFixed(2)}%
        </Text>
      </View>
    </View>
  );
});

const EMPTY_COINS: MarketCoin[] = [];

const keyExtractor = (item: MarketCoin) => item.id;

export default function MarketScreen() {
  const theme = useAppStore((s) => s.theme);
  const themeColors = colors[theme];
  const { data, isLoading, refetch } = useMarket();

  const renderItem = useCallback(
    ({ item, index }: { item: MarketCoin; index: number }) => (
      <CoinRow
        item={item}
        index={index}
        borderColor={themeColors.border}
        textColor={themeColors.text}
        mutedColor={themeColors.textMuted}
        positiveColor={themeColors.positive}
        negativeColor={themeColors.negative}
      />
    ),
    [themeColors.border, themeColors.text, themeColors.textMuted, themeColors.positive, themeColors.negative]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.text }]}>Market</Text>
        <Text style={[styles.subtitle, { color: themeColors.accent }]}>
          Live
        </Text>
      </View>
      <FlatList
        data={data?.data ?? EMPTY_COINS}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={styles.list}
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
    fontFamily: fonts.display.regular,
    fontSize: fontSize.xxl,
  },
  subtitle: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.xs,
    letterSpacing: letterSpacing.wider,
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
    width: 24,
    textAlign: "center",
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
  change: {
    fontFamily: fonts.mono.regular,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
