"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function NavbarSearch(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        router.push("/search?focus=true");
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.push("/search?focus=true")}
      className="flex items-center gap-2.5 transition-colors"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--bg-card-high)",
        borderRadius: 2,
        height: 32,
        padding: "0 12px",
        minWidth: 190,
      }}
    >
      <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-subtle)" }} />
      <span
        className="flex-1 text-left"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          letterSpacing: "0.04em",
          color: "var(--fg-subtle)",
        }}
      >
        Search or ask anything...
      </span>
      <kbd
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-subtle)",
          background: "var(--bg-card)",
          border: "1px solid var(--bg-card-high)",
          borderRadius: 2,
          padding: "1px 5px",
          lineHeight: 1.6,
        }}
      >
        ⌘K
      </kbd>
    </button>
  );
}
