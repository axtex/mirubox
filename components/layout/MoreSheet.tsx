"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
}

const ITEM_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  letterSpacing: "0.06em",
};

function SheetItem({
  label,
  active,
  onClick,
  trailing,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
}): React.JSX.Element {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className="w-full text-left border-0"
      style={{
        ...ITEM_STYLE,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        cursor: "pointer",
        color: active ? "var(--primary)" : "var(--fg-muted)",
        background: pressed ? "var(--bg-card)" : "transparent",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {trailing ? (
        <span
          className="shrink-0"
          style={{ display: "inline-flex", alignItems: "center" }}
        >
          {trailing}
        </span>
      ) : null}
    </button>
  );
}

export function MoreSheet({
  open,
  onClose,
  unreadCount,
}: MoreSheetProps): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [animatingIn, setAnimatingIn] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimatingIn(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setAnimatingIn(false);
    const t = setTimeout(() => setVisible(false), 150);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!visible) return null;

  function navigate(href: string): void {
    onClose();
    router.push(href);
  }

  const communityActive =
    pathname.startsWith("/community") || pathname.startsWith("/lists");
  const scheduleActive = pathname.startsWith("/schedule");
  const notifActive = pathname.startsWith("/notifications");
  const settingsActive = pathname.startsWith("/settings");

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          background: "rgba(0,0,0,0.6)",
          opacity: animatingIn ? 1 : 0,
          transition: "opacity 150ms ease",
        }}
      />

      <div
        role="menu"
        aria-label="More"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (touchStartY.current === null) return;
          const deltaY = e.touches[0].clientY - touchStartY.current;
          if (deltaY > 60) {
            touchStartY.current = null;
            onClose();
          }
        }}
        onTouchEnd={() => {
          touchStartY.current = null;
        }}
        style={{
          position: "fixed",
          bottom: 56,
          left: 0,
          right: 0,
          zIndex: 41,
          background: "var(--bg-elevated)",
          borderTop: "1px solid var(--bg-card-high)",
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom)",
          transform: animatingIn ? "translateY(0)" : "translateY(100%)",
          transition: "transform 150ms ease-out",
        }}
      >
        <SheetItem
          label="NOTIFICATIONS"
          active={notifActive}
          onClick={() => navigate("/notifications")}
          trailing={
            unreadCount > 0 ? (
              <span
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 10,
                  minWidth: 18,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null
          }
        />

        <SheetItem
          label="COMMUNITY"
          active={communityActive}
          onClick={() => navigate("/community")}
        />

        <SheetItem
          label="SCHEDULE"
          active={scheduleActive}
          onClick={() => navigate("/schedule")}
        />

        <SheetItem
          label="SETTINGS"
          active={settingsActive}
          onClick={() => navigate("/settings")}
        />
      </div>
    </>
  );
}
