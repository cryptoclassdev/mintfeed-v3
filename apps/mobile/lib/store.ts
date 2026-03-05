import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ThemeMode } from "@/constants/theme";

interface AppState {
  selectedCategory: "all" | "crypto" | "ai";
  theme: ThemeMode;
  readArticleIds: Record<string, true>;
  walletAddress: string | null;
  walletAuthToken: string | null;
  setCategory: (category: "all" | "crypto" | "ai") => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  markAsRead: (id: string) => void;
  connectWallet: (address: string, authToken: string) => void;
  disconnectWallet: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedCategory: "all",
      theme: "dark",
      readArticleIds: {},
      walletAddress: null,
      walletAuthToken: null,

      setCategory: (category) => set({ selectedCategory: category }),

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

      markAsRead: (id) =>
        set((state) => ({
          readArticleIds: { ...state.readArticleIds, [id]: true as const },
        })),

      connectWallet: (address, authToken) =>
        set({ walletAddress: address, walletAuthToken: authToken }),

      disconnectWallet: () =>
        set({ walletAddress: null, walletAuthToken: null }),
    }),
    {
      name: "mintfeed-app-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        walletAddress: state.walletAddress,
        walletAuthToken: state.walletAuthToken,
        readArticleIds: state.readArticleIds,
      }),
    },
  ),
);
