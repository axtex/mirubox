"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PROFILE_TABS, type ProfileTabId } from "@/lib/profile-types";

interface ProfileTabsProps {
  activeTab: ProfileTabId;
}

export function ProfileTabs({ activeTab }: ProfileTabsProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setTab(id: ProfileTabId): void {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", id);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <nav
      style={{
        margin: 0,
        borderTop: "1px solid var(--bg-card)",
        borderBottom: "1px solid var(--bg-card)",
        overflowX: "auto",
        display: "flex",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="no-scrollbar"
    >
      {PROFILE_TABS.map(({ id, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              letterSpacing: "0.06em",
              padding: "9px 14px",
              color: active ? "var(--primary)" : "var(--fg-subtle)",
              marginBottom: -1,
              whiteSpace: "nowrap",
              flexShrink: 0,
              background: "transparent",
              border: "none",
              borderBottom: active
                ? "1.5px solid var(--primary)"
                : "1.5px solid transparent",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
