"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "next-auth";

interface NavbarClientProps {
  session: Session | null;
}

export function NavbarClient({ session }: NavbarClientProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/auth/signin"
          className="btn-ghost"
          style={{ padding: "7px 14px", minHeight: 36, fontSize: 10 }}
        >
          SIGN IN
        </Link>
        <Link
          href="/auth/signin"
          className="btn-primary"
          style={{ padding: "7px 14px", minHeight: 36, fontSize: 10 }}
        >
          JOIN
        </Link>
      </div>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 p-0.5 transition-all rounded-full"
        style={{ border: "2px solid var(--border-bright)" }}
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--font-anybody)" }}
          >
            {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-48 overflow-hidden z-50"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-bright)",
            borderRadius: 4,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="text-sm font-medium truncate" style={{ color: "var(--fg)", fontFamily: "var(--font-anybody)" }}>
              {session.user.name ?? "User"}
            </p>
            <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--fg-subtle)", fontFamily: "var(--font-space-mono)" }}>
              {session.user.email}
            </p>
          </div>

          {[
            { href: "/profile", label: "PROFILE" },
            { href: "/watchlist", label: "MY WATCHLIST" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 transition-colors text-label"
              style={{ color: "var(--fg-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
                (e.currentTarget as HTMLElement).style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
                (e.currentTarget as HTMLElement).style.color = "var(--fg-muted)";
              }}
            >
              {label}
            </Link>
          ))}

          <button
            onClick={() => signOut()}
            className="block w-full text-left px-4 py-2.5 text-label transition-colors"
            style={{ color: "var(--score-low)", borderTop: "1px solid var(--border)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
          >
            SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}
