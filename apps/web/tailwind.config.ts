import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        appBg: "#000000",
        appCard: "#050505",
        appPrimary: "#f4f4f5",
        appSecondary: "#888888",
        appText1: "#f4f4f5",
        appText2: "#a1a1aa",
        appBorderElem: "rgba(255,255,255,0.08)",
        blue: "#4C8BD0",
        mint: "#00D4AA",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
        brand: ["var(--font-blauer)", "sans-serif"],
        anton: ["var(--font-anton)", "sans-serif"],
      },
      backgroundImage: {
        "glow-top":
          "radial-gradient(circle at 50% -20%, rgba(76, 139, 208, 0.40) 0%, rgba(0,0,0,0) 60%)",
        "glow-bottom":
          "radial-gradient(circle at 50% 120%, rgba(76, 139, 208, 0.40) 0%, rgba(0,0,0,0) 60%)",
        "glow-center":
          "radial-gradient(circle at 50% 50%, rgba(0, 212, 170, 0.12) 0%, rgba(0,0,0,0) 60%)",
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
