import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

const blauerNue = localFont({
  src: "../fonts/BlauerNue-Bold.woff2",
  weight: "700",
  variable: "--font-blauer",
});

export const metadata: Metadata = {
  title: "Midnight | 60-Word Crypto & AI News",
  description:
    "Crypto and AI alpha distilled to the absolute essentials. Read the facts in seconds. Place informed bets instantly on outcomes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`scroll-smooth bg-[#000000] antialiased ${inter.variable} ${jetbrainsMono.variable} ${blauerNue.variable}`}
    >
      <body className="font-sans overflow-x-hidden w-full min-h-screen flex flex-col bg-[#000000] selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
