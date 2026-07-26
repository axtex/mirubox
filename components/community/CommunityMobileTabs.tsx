"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const MOBILE_TABS = [
  { value: "friends", label: "FRIENDS", href: "/community?tab=friends" },
  { value: "lists", label: "LISTS", href: "/community?tab=lists" },
  { value: "news", label: "NEWS", href: "/community?tab=news" },
] as const;

const PILL_BASE = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  letterSpacing: "0.06em",
  padding: "5px 14px",
  borderRadius: 2,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
} as const;

/** Mobile-only community tab pills — mirrors tracker ALL/ANIME/MANGA style. */
export function CommunityMobileTabs(): React.JSX.Element {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const active =
    tabParam === "friends" ||
    tabParam === "lists" ||
    tabParam === "news" ||
    tabParam === "forum"
      ? tabParam
      : "lists";

  return (
    <div className="flex flex-wrap gap-1.5 mb-5 md:hidden">
      {MOBILE_TABS.map(({ value, label, href }) => {
        const isActive = active === value;
        return (
          <Link
            key={value}
            href={href}
            style={{
              ...PILL_BASE,
              background: isActive ? "var(--primary)" : "var(--bg-elevated)",
              color: isActive ? "#fff" : "var(--fg-muted)",
              border: isActive ? "none" : "1px solid var(--bg-card-high, #2a2a2d)",
              cursor: "pointer",
            }}
          >
            {label}
          </Link>
        );
      })}

      <span
        style={{
          ...PILL_BASE,
          background: "var(--bg-elevated)",
          color: "var(--fg-subtle)",
          border: "1px solid var(--bg-card-high, #2a2a2d)",
          opacity: 0.55,
          cursor: "default",
          pointerEvents: "none",
        }}
        aria-disabled
      >
        FORUM
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 8,
            letterSpacing: "0.04em",
            color: "var(--fg-subtle)",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 2,
            padding: "1px 5px",
          }}
        >
          COMING SOON
        </span>
      </span>
    </div>
  );
}
