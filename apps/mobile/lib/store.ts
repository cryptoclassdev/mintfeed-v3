import { create } from "zustand";
import type { ThemeMode } from "@/constants/theme";

interface AppState {
  selectedCategory: "all" | "crypto" | "ai";
  theme: ThemeMode;
  readArticleIds: Set<string>;
  walletAddress: string | null;
  walletAuthToken: string | null;
  setCategory: (category: "all" | "crypto" | "ai") => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  markAsRead: (id: string) => void;
  connectWallet: (address: string, authToken: string) => void;
  disconnectWallet: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCategory: "all",
  theme: "dark",
  readArticleIds: new Set(),
  walletAddress: null,
  walletAuthToken: null,

  setCategory: (category) => set({ selectedCategory: category }),

  setTheme: (theme) => set({ theme }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "dark" ? "light" : "dark",
    })),

  markAsRead: (id) =>
    set((state) => {
      const updated = new Set(state.readArticleIds);
      updated.add(id);
      return { readArticleIds: updated };
    }),

  connectWallet: (address, authToken) => set({ walletAddress: address, walletAuthToken: authToken }),

  disconnectWallet: () => set({ walletAddress: null, walletAuthToken: null }),
}));
