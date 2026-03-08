import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
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

  if (!fontsLoaded) {
    return null;
  }

  if (!hasCompletedOnboarding) {
    return (
      <QueryClientProvider client={queryClient}>
        <MobileWalletProvider
          chain={SOLANA_MWA_CHAIN}
          endpoint={SOLANA_RPC_URL}
          identity={APP_IDENTITY}
        >
          <StatusBar style={theme === "dark" ? "light" : "dark"} />
          <OnboardingFlow />
        </MobileWalletProvider>
      </QueryClientProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <MobileWalletProvider
          chain={SOLANA_MWA_CHAIN}
          endpoint={SOLANA_RPC_URL}
          identity={APP_IDENTITY}
        >
          <StatusBar style={theme === "dark" ? "light" : "dark"} />
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
  );
}
