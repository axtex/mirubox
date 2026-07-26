"use client";

import { useState } from "react";
import {
  getNotifVisual,
  notifBodyText,
  type NotifVisualType,
} from "@/lib/notification-visuals";
import { timeAgo } from "@/lib/time-ago";
import { IconCircle } from "@/components/ui/IconCircle";

export interface NotificationRowData {
  id: string;
  type: NotifVisualType;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string | Date;
}

interface NotificationRowProps {
  notification: NotificationRowData;
  onClick: () => void;
  /** Slightly roomier padding for the full-page list */
  spacious?: boolean;
}

export function NotificationRow({
  notification,
  onClick,
  spacious = false,
}: NotificationRowProps): React.JSX.Element {
  const [hovered, setHovered] = useState(false);
  const visual = getNotifVisual(notification.type);
  const body = notifBodyText(notification.type, notification.body);
  const createdAt =
    notification.createdAt instanceof Date
      ? notification.createdAt
      : new Date(notification.createdAt);

  return (
    <div
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-start"
      style={{
        gap: 10,
        padding: spacious
          ? "12px 16px"
          : notification.read
            ? "10px 14px"
            : "10px 14px 10px 12px",
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
      <IconCircle Icon={visual.Icon} bg={visual.bg} border={visual.border} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 11,
            color: "#e4e1e6",
            fontWeight: notification.read ? 400 : 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notification.title}
        </p>
        {body && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "#5a5a65",
              marginTop: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {body}
          </p>
        )}
      </div>

      <span
        className="shrink-0"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 8,
          color: "#3a3a45",
          whiteSpace: "nowrap",
        }}
      >
        {timeAgo(createdAt)}
      </span>
    </div>
  );
}
