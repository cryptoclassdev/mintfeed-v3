import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "@/constants/theme";

export const QUICK_BET_OPTIONS = [10, 25, 50, 100] as const;
export const QUICK_BET_DEFAULT = 10;
export const QUICK_BET_MIN = QUICK_BET_DEFAULT;
export const QUICK_BET_MAX = 500;
export type QuickBetPreset = (typeof QUICK_BET_OPTIONS)[number];
const PENDING_PREDICTION_TRADE_MAX_AGE_MS = 15 * 60 * 1000;

export type PendingPredictionTradeKind = "buy" | "close" | "claim";
export type PendingPredictionTradeVerification = "sent" | "uncertain";

export interface PendingPredictionTrade {
  id: string;
  walletAddress: string;
  kind: PendingPredictionTradeKind;
  verification: PendingPredictionTradeVerification;
  createdAt: number;
  marketId?: string;
  positionPubkey?: string;
  isYes?: boolean;
  amountUsd?: number;
  externalOrderId?: string | null;
  baselineContracts?: number;
}

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
  pendingPredictionTrades: Record<string, PendingPredictionTrade>;
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
  upsertPendingPredictionTrade: (trade: PendingPredictionTrade) => void;
  removePendingPredictionTrade: (id: string) => void;
  prunePendingPredictionTrades: (now?: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedCategory: "all",
      theme: "dark",
      hapticsEnabled: true,
      readArticleIds: {},
      hasCompletedOnboarding: false,
      quickBetAmount: QUICK_BET_DEFAULT,
      notificationPermission: "undetermined",
      expoPushToken: null,
      feedSessionCount: 0,
      pendingArticleId: null,
      pendingPredictionTrades: {},

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
        set({ quickBetAmount: Math.max(QUICK_BET_MIN, Math.min(QUICK_BET_MAX, Math.floor(amount))) }),

      setNotificationPermission: (status) => set({ notificationPermission: status }),
      setExpoPushToken: (token) => set({ expoPushToken: token }),
      incrementFeedSession: () =>
        set((state) => ({ feedSessionCount: state.feedSessionCount + 1 })),
      setPendingArticleId: (id) => set({ pendingArticleId: id }),
      upsertPendingPredictionTrade: (trade) =>
        set((state) => ({
          pendingPredictionTrades: {
            ...state.pendingPredictionTrades,
            [trade.id]: trade,
          },
        })),
      removePendingPredictionTrade: (id) =>
        set((state) => {
          if (!(id in state.pendingPredictionTrades)) return state;
          const nextTrades = { ...state.pendingPredictionTrades };
          delete nextTrades[id];
          return { pendingPredictionTrades: nextTrades };
        }),
      prunePendingPredictionTrades: (now = Date.now()) =>
        set((state) => {
          let changed = false;
          const nextTrades: Record<string, PendingPredictionTrade> = {};

          for (const [id, trade] of Object.entries(state.pendingPredictionTrades)) {
            if (now - trade.createdAt <= PENDING_PREDICTION_TRADE_MAX_AGE_MS) {
              nextTrades[id] = trade;
            } else {
              changed = true;
            }
          }

          return changed ? { pendingPredictionTrades: nextTrades } : state;
        }),
    }),
    {
      name: "midnight-app-store",
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
        pendingPredictionTrades: state.pendingPredictionTrades,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.quickBetAmount < QUICK_BET_DEFAULT) {
          state.setQuickBetAmount(QUICK_BET_DEFAULT);
        }
        if (state) {
          state.prunePendingPredictionTrades();
        }
        // Prune readArticleIds to prevent unbounded AsyncStorage growth.
        // CUIDs are time-sortable, so reverse-sorting keeps the most recent.
        const MAX_READ_IDS = 500;
        if (state && Object.keys(state.readArticleIds).length > MAX_READ_IDS) {
          const pruned = Object.keys(state.readArticleIds)
            .sort()
            .reverse()
            .slice(0, MAX_READ_IDS);
          const kept: Record<string, true> = {};
          for (const id of pruned) kept[id] = true;
          state.readArticleIds = kept;
        }
      },
    },
  ),
);
