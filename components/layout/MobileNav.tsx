"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookMarked, BookOpen, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/manga", icon: BookOpen, label: "Manga" },
  { href: "/watchlist", icon: BookMarked, label: "Watchlist" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border)",
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors"
            style={{ color: active ? "var(--accent)" : "var(--fg-subtle)" }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
