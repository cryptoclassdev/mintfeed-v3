import { useEffect, useRef, useCallback } from "react";
import { AppState, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";

const EAS_PROJECT_ID = "d1a61761-77d0-4831-ac18-eb984eca0f29";
const SESSIONS_BEFORE_PROMPT = 3;
const MAX_REGISTRATION_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 2_000;

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerTokenWithRetry(
  token: string,
  wallet: string | null,
  retries = MAX_REGISTRATION_RETRIES,
): Promise<boolean> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await api.post("api/v1/notifications/register", {
        json: {
          expoPushToken: token,
          walletAddress: wallet,
          platform: Platform.OS,
          timezoneOffset: new Date().getTimezoneOffset(),
        },
      });
      return true;
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;
      if (isLastAttempt) {
        console.error("[Notifications] Registration failed after retries:", error);
        return false;
      }
      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

export function useNotifications() {
  const router = useRouter();
  const { account } = useMobileWallet();
  const walletAddress = account?.address.toString() ?? null;

  const permission = useAppStore((s) => s.notificationPermission);
  const pushToken = useAppStore((s) => s.expoPushToken);
  const feedSessionCount = useAppStore((s) => s.feedSessionCount);
  const setPermission = useAppStore((s) => s.setNotificationPermission);
  const setPushToken = useAppStore((s) => s.setExpoPushToken);
  const incrementSession = useAppStore((s) => s.incrementFeedSession);

  const responseListener = useRef<Notifications.Subscription | null>(null);
  const registrationInFlight = useRef(false);

  // Stable deep-link handler that always uses current router
  const routeFromNotification = useCallback(
    (data: Record<string, unknown>) => {
      const screen = data.screen as string | undefined;
      const id = data.id as string | undefined;
      if (!screen) return;

      setTimeout(() => {
        switch (screen) {
          case "article":
            if (id) router.push(`/article/${id}`);
            break;
          case "market-sheet":
            if (id) router.push(`/market-sheet/${id}`);
            break;
          case "market":
            router.navigate("/(tabs)/market");
            break;
        }
      }, 500);
    },
    [router],
  );

  // Increment session count on mount
  useEffect(() => {
    incrementSession();
  }, []);

  // Handle notification tap (warm start)
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data ?? {};
        routeFromNotification(data);
      },
    );

    return () => {
      responseListener.current?.remove();
    };
  }, [routeFromNotification]);

  // Handle cold start — check if app was opened via notification
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data ?? {};
        routeFromNotification(data);
      }
    });
  }, [routeFromNotification]);

  // Core permission + registration flow
  // Syncs OS permission state on every mount, separating prompt timing from registration
  useEffect(() => {
    let cancelled = false;

    async function initNotifications() {
      // Always check actual OS permission first — Zustand may be stale
      const { status: osStatus } = await Notifications.getPermissionsAsync();

      if (cancelled) return;

      if (osStatus === "granted") {
        // OS already granted — sync Zustand and register immediately, no session gate
        setPermission("granted");
        await acquireTokenAndRegister(walletAddress);
        return;
      }

      if (osStatus === "denied") {
        setPermission("denied");
        return;
      }

      // OS says undetermined — gate the prompt behind session count
      if (feedSessionCount < SESSIONS_BEFORE_PROMPT) return;

      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (cancelled) return;

      if (newStatus === "granted") {
        setPermission("granted");
        await acquireTokenAndRegister(walletAddress);
      } else {
        setPermission("denied");
      }
    }

    initNotifications();

    return () => {
      cancelled = true;
    };
  }, [feedSessionCount, walletAddress]);

  // Re-register when wallet changes (token already exists)
  useEffect(() => {
    if (pushToken && walletAddress && permission === "granted") {
      registerTokenWithRetry(pushToken, walletAddress);
    }
  }, [walletAddress, pushToken, permission]);

  // Re-register when app returns to foreground (catches token refresh + timezone drift)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && pushToken && permission === "granted") {
        registerTokenWithRetry(pushToken, walletAddress);
      }
    });

    return () => subscription.remove();
  }, [pushToken, permission, walletAddress]);

  async function acquireTokenAndRegister(wallet: string | null) {
    if (registrationInFlight.current) return;
    registrationInFlight.current = true;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      });
      const token = tokenData.data;
      setPushToken(token);

      const success = await registerTokenWithRetry(token, wallet);
      if (!success) {
        console.warn("[Notifications] Device registered locally but server registration failed");
      }
    } catch (error) {
      console.error("[Notifications] Failed to get push token:", error);
    } finally {
      registrationInFlight.current = false;
    }
  }
}
