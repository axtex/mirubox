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
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session) {
    return (
      <Link href="/auth/signin" className="btn-primary shrink-0">
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-1 transition-all"
        style={{ border: "2px solid var(--border)" }}
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
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-48 rounded-lg overflow-hidden z-50"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
              {session.user.name ?? "User"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>
              {session.user.email}
            </p>
          </div>
          {[
            { href: "/profile", label: "Profile" },
            { href: "/watchlist", label: "My Watchlist" },
            { href: "/settings", label: "Settings" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm transition-colors"
              style={{ color: "var(--fg-muted)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-elevated)";
                (e.currentTarget as HTMLElement).style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "";
                (e.currentTarget as HTMLElement).style.color =
                  "var(--fg-muted)";
              }}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => signOut()}
            className="block w-full text-left px-4 py-2.5 text-sm transition-colors border-t"
            style={{
              color: "var(--danger)",
              borderColor: "var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--bg-elevated)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "";
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
