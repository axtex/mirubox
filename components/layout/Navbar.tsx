import Link from "next/link";
import { auth } from "@/auth";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();

  return (
    <nav
      className="hidden md:flex items-center justify-between px-6 h-[60px] sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: "var(--bg-overlay)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        className="text-xl font-bold tracking-tight shrink-0"
        style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
      >
        miru<span style={{ color: "var(--accent)" }}>box</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1 mx-4">
        <NavLink href="/">Anime</NavLink>
        <NavLink href="/manga">Manga</NavLink>
      </div>

      {/* Search */}
      <NavSearchBar />

      {/* Right: auth */}
      <NavbarClient session={session} />
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{ color: "var(--fg-muted)" }}
    >
      {children}
    </Link>
  );
}

function NavSearchBar() {
  return (
    <Link
      href="/search"
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm flex-1 max-w-sm mx-4 transition-all"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        color: "var(--fg-muted)",
      }}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
      </svg>
      <span className="flex-1">Search anime, manga…</span>
      <kbd
        className="text-xs px-1.5 py-0.5 rounded"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--fg-subtle)",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
        }}
      >
        ⌘K
      </kbd>
    </Link>
  );
}
