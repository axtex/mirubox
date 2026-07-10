import type { Metadata } from "next";
import { Anybody, Geist, Space_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoginXPTracker } from "@/components/layout/LoginXPTracker";
import { TrackerProvider } from "@/lib/tracker-context";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { SessionProviderWrapper } from "@/components/providers/SessionProviderWrapper";
import { auth } from "@/auth";
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

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
        <SessionProviderWrapper session={session}>
          <TrackerProvider isLoggedIn={!!session?.user}>
            <AuthModalProvider>
              <LoginXPTracker isLoggedIn={!!session?.user} />
              <Navbar />
              <MobileNav />
              <main className="flex flex-1 flex-col min-h-0 pb-[56px] md:pb-0">
                <PageContainer className="flex flex-1 flex-col min-h-0">{children}</PageContainer>
              </main>
              <Footer />
              <AuthModal />
            </AuthModalProvider>
          </TrackerProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
