import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "@/constants/theme";

export const QUICK_BET_OPTIONS = [5, 10, 25, 50] as const;
export const QUICK_BET_MIN = 5;
export type QuickBetPreset = (typeof QUICK_BET_OPTIONS)[number];

type NotificationPermission = "undetermined" | "granted" | "denied";

interface AppState {
  selectedCategory: "all" | "crypto" | "ai";
  theme: ThemeMode;
  hapticsEnabled: boolean;
  readArticleIds: Record<string, true>;
  hasCompletedOnboarding: boolean;
  quickBetAmount: number;
  notificationPermission: NotificationPermission;
  expoPushToken: string | null;
  feedSessionCount: number;
  pendingArticleId: string | null;
  setCategory: (category: "all" | "crypto" | "ai") => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleHaptics: () => void;
  markAsRead: (id: string) => void;
  completeOnboarding: () => void;
  setQuickBetAmount: (amount: number) => void;
  setNotificationPermission: (status: NotificationPermission) => void;
  setExpoPushToken: (token: string | null) => void;
  incrementFeedSession: () => void;
  setPendingArticleId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedCategory: "all",
      theme: "dark",
      hapticsEnabled: true,
      readArticleIds: {},
      hasCompletedOnboarding: false,
      quickBetAmount: 5,
      notificationPermission: "undetermined",
      expoPushToken: null,
      feedSessionCount: 0,
      pendingArticleId: null,

      setCategory: (category) => set({ selectedCategory: category }),

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

      toggleHaptics: () =>
        set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),

      markAsRead: (id) =>
        set((state) => ({
          readArticleIds: { ...state.readArticleIds, [id]: true as const },
        })),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setQuickBetAmount: (amount) =>
        set({ quickBetAmount: Math.max(QUICK_BET_MIN, Math.floor(amount)) }),

      setNotificationPermission: (status) => set({ notificationPermission: status }),
      setExpoPushToken: (token) => set({ expoPushToken: token }),
      incrementFeedSession: () =>
        set((state) => ({ feedSessionCount: state.feedSessionCount + 1 })),
      setPendingArticleId: (id) => set({ pendingArticleId: id }),
    }),
    {
      name: "mintfeed-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        hapticsEnabled: state.hapticsEnabled,
        readArticleIds: state.readArticleIds,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        quickBetAmount: state.quickBetAmount,
        notificationPermission: state.notificationPermission,
        expoPushToken: state.expoPushToken,
        feedSessionCount: state.feedSessionCount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.quickBetAmount < QUICK_BET_MIN) {
          state.setQuickBetAmount(QUICK_BET_MIN);
        }
      },
    },
  ),
);
