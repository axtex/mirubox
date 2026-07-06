"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const NAV_LINKS = [
  { href: "/anime",     label: "ANIME",     active: (p: string) => p.startsWith("/anime") },
  { href: "/manga",     label: "MANGA",     active: (p: string) => p.startsWith("/manga") },
  { href: "/archive",   label: "TRACKER",   active: (p: string) => p.startsWith("/archive") },
];

const COMMUNITY_LINKS = [
  { href: "/community?tab=forum",   label: "FORUM",   tab: "forum" },
  { href: "/community?tab=news",    label: "NEWS",    tab: "news" },
  { href: "/community?tab=friends", label: "FRIENDS", tab: "friends" },
  { href: "/community?tab=lists",   label: "LISTS",   tab: "lists" },
] as const;

const LINK_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  letterSpacing: "0.08em",
};

function isCommunityActive(pathname: string): boolean {
  return pathname.startsWith("/community") || pathname.startsWith("/lists");
}

function NavLink({
  href,
  label,
  isActive,
}: {
  href: string;
  label: string;
  isActive: boolean;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className="flex flex-col"
      style={{
        ...LINK_STYLE,
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
}

function CommunityNavDropdown(): React.JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isActive = isCommunityActive(pathname);
  const currentTab = pathname.startsWith("/lists")
    ? "lists"
    : (searchParams.get("tab") ?? "lists");

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex flex-col items-start border-0 bg-transparent p-0 cursor-pointer"
        style={{
          ...LINK_STYLE,
          color: isActive ? "var(--primary)" : "var(--fg-subtle)",
        }}
      >
        <span className="inline-flex items-center gap-1">
          COMMUNITY
          <ChevronDown
            size={10}
            style={{
              transition: "transform 0.15s ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        </span>
        <span
          className="mt-1 w-full"
          style={{
            height: 1.5,
            background: isActive ? "var(--primary)" : "transparent",
          }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 overflow-hidden"
          style={{
            marginTop: 8,
            minWidth: 140,
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-card-high)",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {COMMUNITY_LINKS.map(({ href, label, tab }) => (
            <CommunityDropdownItem
              key={tab}
              href={href}
              label={label}
              isActive={currentTab === tab}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityDropdownItem({
  href,
  label,
  isActive,
  onNavigate,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onNavigate: () => void;
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="block px-4 py-2.5"
      style={{
        ...LINK_STYLE,
        letterSpacing: "0.06em",
        color: isActive ? "var(--primary)" : "var(--fg-muted)",
        background: hovered ? "var(--bg-card)" : "transparent",
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {label}
    </Link>
  );
}

export function NavbarLinks(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-7 ml-8">
      {NAV_LINKS.map(({ href, label, active }) => (
        <NavLink key={label} href={href} label={label} isActive={active(pathname)} />
      ))}
      <CommunityNavDropdown />
    </div>
  );
}
