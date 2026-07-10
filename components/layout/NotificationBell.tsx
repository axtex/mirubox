"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";
import type { Session } from "next-auth";
import { useNotificationPolling } from "@/hooks/useNotificationPolling";
import { getNotifVisual, type NotifVisualType } from "@/lib/notification-visuals";
import { timeAgo } from "@/lib/time-ago";

interface NotificationItem {
  id: string;
  type: NotifVisualType;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  listId: string | null;
  fromUser: { username: string | null; displayName: string | null; avatarUrl: string | null } | null;
  list: { slug: string } | null;
}

function getLinkTarget(n: NotificationItem): string | null {
  switch (n.type) {
    case "BADGE_EARNED":
    case "RANK_UP":
      return "/profile?tab=stats";
    case "LIST_LIKED":
      return n.list?.slug ? `/lists/${n.list.slug}` : null;
    case "NEW_FOLLOWER":
      return n.fromUser?.username ? `/u/${n.fromUser.username}` : null;
    default:
      return null;
  }
}

export function NotificationBell({ session: initialSession }: { session: Session | null }) {
  const { data: liveSession } = useSession();
  const session = liveSession ?? initialSession;
  const router = useRouter();
  const { unreadCount, setUnreadCount } = useNotificationPolling();

  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const openDropdown = useCallback(async () => {
    setOpen(true);
    setUnreadCount(0);
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (res.ok) {
        const data = (await res.json()) as { notifications: NotificationItem[] };
        setNotifications(data.notifications.map((n) => ({ ...n, read: true })));
      }
      fetch("/api/notifications/read-all", { method: "PATCH" }).catch(() => {});
    } catch {
      // leave list as-is on network error
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!session?.user) return null;

  function handleRowClick(n: NotificationItem) {
    const target = getLinkTarget(n);
    setOpen(false);
    if (target) router.push(target);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (open) setOpen(false);
          else void openDropdown();
        }}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative flex items-center justify-center transition-colors"
        style={{
          width: 32,
          height: 32,
          background: hovered || open ? "rgba(232, 23, 63, 0.05)" : "transparent",
          border: `1px solid ${hovered || open ? "var(--primary)" : "var(--bg-card-high)"}`,
          borderRadius: 2,
          color: hovered || open ? "var(--primary)" : "var(--fg-muted)",
          cursor: "pointer",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="relative inline-flex">
          <Bell className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--primary)",
              }}
            />
          )}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 overflow-hidden"
          style={{
            marginTop: 8,
            width: 320,
            background: "var(--bg-elevated)",
            border: "1px solid var(--bg-card-high)",
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <div className="scrollbar-theme" style={{ maxHeight: 400, overflowY: "auto" }}>
            {loading && notifications.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-faint)",
                  padding: "28px 14px",
                  textAlign: "center",
                }}
              >
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-faint)",
                  padding: "28px 14px",
                  textAlign: "center",
                }}
              >
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} onClick={() => handleRowClick(n)} />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/profile?tab=activity");
            }}
            className="notif-footer"
            style={{
              display: "block",
              width: "100%",
              borderTop: "1px solid var(--bg-card)",
              padding: "10px 14px",
              textAlign: "center",
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--primary)",
              background: "none",
              cursor: "pointer",
            }}
          >
            View all
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onClick,
}: {
  notification: NotificationItem;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const visual = getNotifVisual(notification.type, notification.body);

  return (
    <div
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-start"
      style={{
        gap: 10,
        padding: notification.read ? "10px 14px" : "10px 14px 10px 12px",
        borderLeft: notification.read ? "none" : "2px solid var(--primary)",
        borderBottom: "1px solid var(--bg-card)",
        background: hovered
          ? "var(--bg-surface)"
          : notification.read
            ? "transparent"
            : "rgba(232, 23, 63, 0.02)",
        cursor: "pointer",
        transition: "background 100ms",
      }}
    >
      <span
        className="flex items-center justify-center shrink-0"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: visual.bg,
          border: `1px solid ${visual.border}`,
          fontSize: 12,
        }}
        aria-hidden
      >
        {visual.emoji}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 11,
            color: "var(--fg)",
            fontWeight: notification.read ? 400 : 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notification.title}
        </p>
        {notification.body && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg-subtle)",
              marginTop: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {notification.body}
          </p>
        )}
      </div>

      <span
        className="shrink-0"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 8,
          color: "var(--fg-faint)",
          whiteSpace: "nowrap",
        }}
      >
        {timeAgo(new Date(notification.createdAt))}
      </span>
    </div>
  );
}
