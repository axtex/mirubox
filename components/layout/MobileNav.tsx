"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Play, Search, BookMarked, User } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",          icon: Home,       label: "HOME",    active: (p: string) => p === "/" },
  { href: "/anime",     icon: Play,       label: "ANIME",   active: (p: string) => p.startsWith("/anime") },
  { href: "/search",    icon: Search,     label: "SEARCH",  active: (p: string) => p.startsWith("/search") },
  { href: "/tracker",   icon: BookMarked, label: "TRACKER", active: (p: string) => p.startsWith("/tracker") },
  { href: "/profile",   icon: User,       label: "PROFILE", active: (p: string) => p.startsWith("/profile") },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
        height: 56,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label, active }) => {
        const isActive = active(pathname);
        return (
          <Link
            key={label}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors"
            style={{ color: isActive ? "var(--primary)" : "var(--fg-subtle)" }}
          >
            <Icon className="w-5 h-5" />
            {isActive && (
              <span
                className="text-label"
                style={{ fontSize: 9, color: "var(--primary)", fontFamily: "var(--font-space-mono)" }}
              >
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
