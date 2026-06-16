import Link from "next/link";
import { Search } from "lucide-react";
import { auth } from "@/auth";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();

  return (
    <nav
      className="hidden md:flex items-center justify-between px-8 h-[60px] sticky top-0 z-50 backdrop-blur-[20px]"
      style={{
        background: "rgba(15,15,18,0.95)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        className="shrink-0 text-[22px] font-bold tracking-tight"
        style={{ fontFamily: "var(--font-anybody)" }}
      >
        <span style={{ color: "var(--fg)" }}>miru</span>
        <span style={{ color: "var(--primary)" }}>box</span>
      </Link>

      {/* Center nav */}
      <div className="flex items-center gap-7 mx-8">
        <NavLink href="/">ANIME</NavLink>
        <NavLink href="/manga">MANGA</NavLink>
        <ComingSoon label="STUDIOS" />
        <ComingSoon label="COMMUNITY" />
      </div>

      {/* Search */}
      <NavSearchBar />

      {/* Auth */}
      <NavbarClient session={session} />
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-label link-subtle">
      {children}
    </Link>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="relative group">
      <span className="text-label cursor-default" style={{ color: "var(--fg-subtle)", opacity: 0.5 }}>
        {label}
      </span>
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap"
        style={{
          background: "var(--bg-card-high)",
          border: "1px solid var(--border-bright)",
          borderRadius: 2,
          fontSize: 9,
          fontFamily: "var(--font-space-mono)",
          letterSpacing: "0.08em",
          color: "var(--fg-muted)",
        }}
      >
        COMING SOON
      </div>
    </div>
  );
}

function NavSearchBar() {
  return (
    <Link
      href="/search"
      className="flex items-center gap-2.5 px-3 py-2 flex-1 max-w-[280px] mx-6 transition-all"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 2,
        color: "var(--fg-muted)",
      }}
    >
      <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-subtle)" }} />
      <span className="flex-1 text-label" style={{ color: "var(--fg-subtle)" }}>SEARCH</span>
      <kbd
        className="text-[10px] px-1.5 py-0.5 shrink-0"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--fg-subtle)",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-space-mono)",
          borderRadius: 2,
        }}
      >
        ⌘K
      </kbd>
    </Link>
  );
}
