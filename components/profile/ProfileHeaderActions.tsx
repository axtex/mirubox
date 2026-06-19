"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Share2 } from "lucide-react";

const ICON_BTN_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 2,
  border: "1px solid var(--bg-card-high)",
  background: "transparent",
  color: "var(--fg-muted)",
  cursor: "pointer",
  transition: "border-color 0.15s, color 0.15s, background 0.15s",
};

export function ProfileHeaderActions(): React.ReactElement {
  const [shareHovered, setShareHovered] = useState(false);
  const [editHovered, setEditHovered] = useState(false);

  async function handleShare(): Promise<void> {
    const url = window.location.href;
    const title = "mirubox profile";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard unavailable — no-op.
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => void handleShare()}
        aria-label="Share profile"
        className="transition-colors"
        style={{
          ...ICON_BTN_BASE,
          borderColor: shareHovered ? "var(--primary)" : "var(--bg-card-high)",
          color: shareHovered ? "var(--primary)" : "var(--fg-muted)",
          background: shareHovered ? "rgba(232, 23, 63, 0.05)" : "transparent",
        }}
        onMouseEnter={() => setShareHovered(true)}
        onMouseLeave={() => setShareHovered(false)}
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      <Link
        href="/settings"
        aria-label="Edit profile"
        className="transition-colors"
        style={{
          ...ICON_BTN_BASE,
          borderColor: editHovered ? "var(--primary)" : "var(--bg-card-high)",
          color: editHovered ? "var(--primary)" : "var(--fg-muted)",
          background: editHovered ? "rgba(232, 23, 63, 0.05)" : "transparent",
          textDecoration: "none",
        }}
        onMouseEnter={() => setEditHovered(true)}
        onMouseLeave={() => setEditHovered(false)}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
