"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/context/AuthModalContext";
import { UserAvatar } from "@/components/avatar/UserAvatar";

const ITEM_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  letterSpacing: "0.06em",
};

const MENU_ITEM_CLASS = "block px-4 py-2.5 font-mono text-[10px] tracking-[0.06em]";

export function NavbarClient() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (status === "loading") {
    return (
      <div
        aria-hidden
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "1px solid var(--bg-card-high)",
          background: "var(--bg-card)",
        }}
      />
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() =>
          openAuthModal({ reason: "access your profile and tracker", callbackUrl: pathname })
        }
        className="btn-ghost"
        style={{ height: 32, minHeight: 32, padding: "0 14px", fontSize: 10 }}
      >
        SIGN IN
      </button>
    );
  }

  const displayName =
    session.user.displayName || session.user.name || session.user.email?.split("@")[0] || "Anonymous";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Open account menu"
        aria-expanded={open}
        className="flex items-center justify-center transition-colors"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <UserAvatar
          username={session.user.username}
          userId={session.user.id}
          displayName={displayName}
          avatarUrl={session.user.avatarUrl}
          size={32}
          borderColor={hovered || open ? "var(--primary)" : "var(--bg-card-high)"}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 overflow-hidden"
          style={{
            marginTop: 8,
            minWidth: 180,
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-card-high)",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid var(--bg-card)` }}
          >
            <p style={{ ...ITEM_STYLE, fontSize: 11, fontWeight: 700, color: "var(--fg)" }}>
              {displayName}
            </p>
            <p style={{ ...ITEM_STYLE, fontSize: 10, color: "var(--fg-subtle)", marginTop: 2 }}>
              {session.user.email}
            </p>
          </div>

          {[
            { href: "/profile",  label: "PROFILE" },
            { href: "/import",   label: "IMPORT LIST" },
            { href: "/settings", label: "SETTINGS" },
          ].map(({ href, label }) => (
            <DropdownLink key={href} href={href} onNavigate={() => setOpen(false)}>
              {label}
            </DropdownLink>
          ))}

          <div style={{ height: 1, background: "var(--bg-card)" }} />

          <SignOutButton />
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      prefetch
      onClick={onNavigate}
      className={MENU_ITEM_CLASS}
      style={{
        color: "var(--fg-muted)",
        background: hovered ? "var(--bg-card)" : "transparent",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}

function SignOutButton() {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => signOut()}
      className={`${MENU_ITEM_CLASS} w-full text-left border-0`}
      style={{
        color: hovered ? "var(--primary)" : "var(--fg-subtle)",
        background: hovered ? "rgba(232, 23, 63, 0.05)" : "transparent",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      SIGN OUT
    </button>
  );
}
