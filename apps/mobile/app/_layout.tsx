import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  focusManager,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { MobileWalletProvider, useMobileWallet } from "@wallet-ui/react-native-web3js";
import { fetchPositions, fetchOrders } from "@/lib/prediction-client";
import * as Sentry from "@sentry/react-native";
import { Anton_400Regular } from "@expo-google-fonts/anton";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppStore } from "@/lib/store";
import { colors } from "@/constants/theme";
import { APP_IDENTITY, SOLANA_MWA_CHAIN, SOLANA_RPC_URL } from "@/lib/solana";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useNotifications } from "@/hooks/useNotifications";
import { PredictionTradeReconciliation } from "@/components/trading/PredictionTradeReconciliation";

SplashScreen.preventAutoHideAsync();

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__ && Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
  environment: process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ?? "development",
  tracesSampleRate: 0.1,
});

function NotificationBootstrap() {
  useNotifications();
  return null;
}

const WALLET_DATA_STALE_TIME_MS = 30_000;

/**
 * Warms the prediction-positions and prediction-orders query caches as soon
 * as a wallet is available, so opening the profile screen paints instantly
 * from cache instead of showing a spinner on every cold visit.
 */
function WalletDataPrefetch() {
  const { account } = useMobileWallet();
  const queryClient = useQueryClient();
  const address = account?.address.toString() ?? null;

  useEffect(() => {
    if (!address) return;
    queryClient.prefetchQuery({
      queryKey: ["prediction-positions", address, "cached"],
      queryFn: () => fetchPositions(address, { fresh: false }),
      staleTime: WALLET_DATA_STALE_TIME_MS,
    });
    queryClient.prefetchQuery({
      queryKey: ["prediction-orders", address, "cached"],
      queryFn: () => fetchOrders(address, { fresh: false }),
      staleTime: WALLET_DATA_STALE_TIME_MS,
    });
  }, [address, queryClient]);

  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
});

function RootLayout() {
  const theme = useAppStore((s) => s.theme);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const themeColors = colors[theme];

  const [fontsLoaded] = useFonts({
    Anton_400Regular,
    Inter_300Light,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    "BlauerNue-Regular": require("@/assets/fonts/BlauerNue-Regular.ttf"),
    "BlauerNue-Bold": require("@/assets/fonts/BlauerNue-Bold.ttf"),
    "BlauerNue-ExtraBold": require("@/assets/fonts/BlauerNue-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Refetch active queries when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (status: AppStateStatus) => {
      focusManager.setFocused(status === "active");
    });
    return () => sub.remove();
  }, []);

  // TODO: Add NetInfo → onlineManager wiring after next native rebuild
  // (requires `npx expo prebuild` to link @react-native-community/netinfo)

  if (!fontsLoaded) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <MobileWalletProvider
            chain={SOLANA_MWA_CHAIN}
            endpoint={SOLANA_RPC_URL}
            identity={APP_IDENTITY}
          >
            <StatusBar style={theme === "dark" ? "light" : "dark"} />
            <NotificationBootstrap />
            <WalletDataPrefetch />
            <PredictionTradeReconciliation />
            <OnboardingFlow />
          </MobileWalletProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <MobileWalletProvider
            chain={SOLANA_MWA_CHAIN}
            endpoint={SOLANA_RPC_URL}
            identity={APP_IDENTITY}
          >
            <StatusBar style={theme === "dark" ? "light" : "dark"} />
            <NotificationBootstrap />
            <WalletDataPrefetch />
            <PredictionTradeReconciliation />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: themeColors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="article/[id]"
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
              <Stack.Screen
                name="market-sheet/[id]"
                options={{
                  presentation: "modal",
                  animation: "slide_from_bottom",
                }}
              />
            </Stack>
            <ToastProvider />
          </MobileWalletProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
