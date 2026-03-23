import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Anton } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
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
      className={`scroll-smooth bg-[#fafafa] antialiased ${inter.variable} ${jetbrainsMono.variable} ${blauerNue.variable} ${anton.variable}`}
    >
      <body className="font-sans overflow-x-hidden w-full min-h-screen flex flex-col bg-[#fafafa]">
        {children}
      </body>
    </html>
  );
}
