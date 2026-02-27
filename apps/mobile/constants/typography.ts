export const fonts = {
  display: {
    regular: "Anton_400Regular",
  },
  body: {
    light: "Inter_300Light",
    regular: "Inter_400Regular",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  mono: {
    regular: "JetBrainsMono_400Regular",
    bold: "JetBrainsMono_700Bold",
  },
} as const;

export const fontSize = {
  xxs: 9,
  xs: 10,
  sm: 11,
  base: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  hero: 80,
} as const;

export const lineHeight = {
  xxs: 12,
  xs: 14,
  sm: 16,
  base: 20,
  lg: 26,
  xl: 30,
  xxl: 34,
  xxxl: 40,
  hero: 72,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 1,
  wider: 2,
} as const;
