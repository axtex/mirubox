"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/anime",     label: "ANIME",     active: (p: string) => p.startsWith("/anime") },
  { href: "/manga",     label: "MANGA",     active: (p: string) => p.startsWith("/manga") },
  { href: "/watchlist", label: "TRACKER",   active: (p: string) => p.startsWith("/watchlist") },
  { href: "/community", label: "COMMUNITY", active: (p: string) => p.startsWith("/community") },
];

export function NavbarLinks(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-7 ml-8">
      {NAV_LINKS.map(({ href, label, active }) => {
        const isActive = active(pathname);
        return (
          <Link
            key={label}
            href={href}
            className="flex flex-col"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: isActive ? "var(--primary)" : "var(--fg-subtle)",
              textDecoration: "none",
            }}
          >
            <span>{label}</span>
            <span
              className="mt-1"
              style={{
                height: 1.5,
                background: isActive ? "var(--primary)" : "transparent",
              }}
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
