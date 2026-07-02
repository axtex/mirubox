import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Community — mirubox",
};

const COMMUNITY_LINKS = [
  { href: "/lists", label: "LISTS" },
] as const;

export default function CommunityPage() {
  return (
    <div className="page-container py-8">
      <div style={{ marginBottom: 24 }}>
        <h1
          className="text-headline-lg font-display uppercase"
          style={{ marginBottom: 4 }}
        >
          COMMUNITY
        </h1>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "var(--fg-muted)",
          }}
        >
          Lists, shared taste, and more
        </p>
      </div>

      <nav
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 32,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 0,
        }}
      >
        {COMMUNITY_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              padding: "10px 14px",
              color: "var(--fg-muted)",
              borderBottom: "1.5px solid transparent",
              marginBottom: -1,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            color: "var(--fg-subtle)",
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          Browse curated lists from mirubox and the community. Friends and shared taste profiles are coming soon.
        </p>
      </div>
    </div>
  );
}
