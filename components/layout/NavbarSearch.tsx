"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function NavbarSearch(): React.JSX.Element {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

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
      aria-label="Search"
      className="flex items-center justify-center transition-colors"
      style={{
        width: 32,
        height: 32,
        background: hovered ? "rgba(232, 23, 63, 0.05)" : "transparent",
        border: `1px solid ${hovered ? "var(--primary)" : "var(--bg-card-high)"}`,
        borderRadius: 2,
        color: hovered ? "var(--primary)" : "var(--fg-muted)",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Search className="w-3.5 h-3.5" />
    </button>
  );
}
