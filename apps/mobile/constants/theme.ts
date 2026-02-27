export const colors = {
  dark: {
    background: "#030303",
    card: "#111111",
    text: "#f0f0f0",
    textSecondary: "#cccccc",
    textMuted: "#888888",
    accent: "#E60000",
    accentDark: "#8a0000",
    border: "#333333",
    overlay: "rgba(0, 0, 0, 0.6)",
    positive: "#00ff66",
    negative: "#E60000",
  },
  light: {
    background: "#f5f5f5",
    card: "#ffffff",
    text: "#111111",
    textSecondary: "#555555",
    textMuted: "#999999",
    accent: "#cc0000",
    accentDark: "#880000",
    border: "#dddddd",
    overlay: "rgba(0, 0, 0, 0.4)",
    positive: "#00cc55",
    negative: "#cc0000",
  },
} as const;

export type ThemeMode = "dark" | "light";
export type ThemeColors = (typeof colors)["dark"] | (typeof colors)["light"];
