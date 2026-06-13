import type { Metadata } from "next";
import { Inter, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";

/*
  Outfit — display font with geometric warmth; great for anime titles/hero text
  Inter — clean, highly readable body text
  JetBrains Mono — sharp mono for ratings, episode counts, metadata
*/
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["system-ui", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: "mirubox — Track. Discover. Explore.",
  description: "Intelligent anime & manga discovery platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh flex flex-col" style={{ background: "var(--bg)", color: "var(--fg)" }}>
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
