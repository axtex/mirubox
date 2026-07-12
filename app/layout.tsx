import type { Metadata } from "next";
import { Anybody, Geist, Space_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoginXPTracker } from "@/components/layout/LoginXPTracker";
import { TrackerProvider } from "@/lib/tracker-context";
import { SeasonChallengeHost } from "@/components/season-challenge/SeasonChallengeHost";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AuthModalLazy } from "@/components/auth/AuthModalLazy";
import { ToastProvider } from "@/context/ToastContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";

const anybody = Anybody({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-anybody",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mirubox — Track. Discover. Explore.",
  description: "Intelligent anime & manga discovery platform",
  metadataBase: new URL("https://mirubox.vercel.app"),
  openGraph: {
    siteName: "mirubox",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${anybody.variable}
          ${geist.variable}
          ${spaceMono.variable}
          font-sans
          bg-[#0f0f12]
          text-[#e4e1e6]
          min-h-dvh
          flex
          flex-col
        `}
      >
        <SessionProviderWrapper>
          <ToastProvider>
            <TrackerProvider>
              <SeasonChallengeHost />
              <AuthModalProvider>
                <LoginXPTracker />
                <Navbar />
                <MobileNav />
                <main className="flex flex-1 flex-col min-h-0 pb-[56px] md:pb-0">
                  <PageContainer className="flex flex-1 flex-col min-h-0">{children}</PageContainer>
                </main>
                <Footer />
                <AuthModalLazy />
                <ToastContainer />
              </AuthModalProvider>
            </TrackerProvider>
          </ToastProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
