"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, BookMarked, BookOpen, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",         icon: Home,      label: "Home" },
  { href: "/search",   icon: Search,    label: "Search" },
  { href: "/watchlist", icon: BookMarked, label: "Watchlist" },
  { href: "/manga",    icon: BookOpen,  label: "Manga" },
  { href: "/profile",  icon: User,      label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex backdrop-blur-[20px]"
      style={{
        background: "rgba(15,15,18,0.98)",
        borderTop: "1px solid var(--border)",
        height: 64,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors"
            style={{ color: active ? "var(--primary)" : "var(--fg-subtle)" }}
          >
            <Icon className="w-5 h-5" />
            {active && (
              <span className="text-label" style={{ fontSize: 9, color: "var(--primary)" }}>
                {label.toUpperCase()}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
