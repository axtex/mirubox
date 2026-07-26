"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, BookMarked, User, Menu } from "lucide-react";
import { useNotificationPolling } from "@/hooks/useNotificationPolling";
import { MoreSheet } from "@/components/layout/MoreSheet";

export function MobileNav(): React.JSX.Element {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount, setUnreadCount } = useNotificationPolling();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/notifications")) setUnreadCount(0);
  }, [pathname, setUnreadCount]);

  const homeActive = pathname === "/";
  const searchActive =
    pathname.startsWith("/search") ||
    pathname.startsWith("/anime") ||
    pathname.startsWith("/manga");
  const trackerActive = pathname.startsWith("/tracker");
  const profileActive =
    pathname.startsWith("/profile") || pathname.startsWith("/u/");
  const moreActive = moreOpen;

  const loggedInUnread = session?.user ? unreadCount : 0;

  return (
    <>
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        unreadCount={loggedInUnread}
      />

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
        style={{
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border)",
          // Content row + home-indicator inset (border-box: padding sits inside total height)
          height: "calc(64px + env(safe-area-inset-bottom, 0px))",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <NavLink
          href="/"
          label="Home"
          active={homeActive && !moreOpen}
          Icon={Home}
        />
        <NavLink
          href="/search"
          label="Search"
          active={searchActive && !moreOpen}
          Icon={Search}
        />
        <NavLink
          href="/tracker"
          label="Tracker"
          active={trackerActive && !moreOpen}
          Icon={BookMarked}
        />
        <NavLink
          href="/profile"
          label="Profile"
          active={profileActive && !moreOpen}
          Icon={User}
        />

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="flex-1 flex items-center justify-center min-h-[44px] transition-colors relative"
          style={{
            color: moreActive ? "var(--primary)" : "var(--fg-subtle)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="More"
          aria-expanded={moreOpen}
        >
          <span className="relative inline-flex">
            <Menu className="w-5 h-5" />
            {loggedInUnread > 0 && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 0,
                  right: -2,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--primary)",
                }}
              />
            )}
          </span>
        </button>
      </nav>
    </>
  );
}

function NavLink({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: typeof Home;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      prefetch
      aria-label={label}
      className="flex-1 flex items-center justify-center min-h-[44px] transition-colors"
      style={{ color: active ? "var(--primary)" : "var(--fg-subtle)" }}
    >
      <Icon className="w-5 h-5" />
    </Link>
  );
}
