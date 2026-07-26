"use client";

import { useRouter } from "next/navigation";
import {
  NotificationRow,
  type NotificationRowData,
} from "@/components/notifications/NotificationRow";
import { getNotificationLinkTarget } from "@/lib/notification-links";
import type { NotifVisualType } from "@/lib/notification-visuals";

export interface NotificationsListItem extends NotificationRowData {
  listId: string | null;
  mediaId: number | null;
  fromUser: { username: string | null } | null;
  list: { slug: string } | null;
}

interface NotificationsListProps {
  notifications: NotificationsListItem[];
}

export function NotificationsList({
  notifications,
}: NotificationsListProps): React.JSX.Element {
  const router = useRouter();

  if (notifications.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-muted)",
          textAlign: "center",
          padding: "40px 20px",
          margin: 0,
        }}
      >
        No notifications yet
      </p>
    );
  }

  return (
    <div>
      {notifications.map((n) => (
        <NotificationRow
          key={n.id}
          notification={{ ...n, read: true }}
          spacious
          onClick={() => {
            const target = getNotificationLinkTarget({
              type: n.type as NotifVisualType,
              listId: n.listId,
              mediaId: n.mediaId,
              fromUser: n.fromUser,
              list: n.list,
            });
            if (target) router.push(target);
          }}
        />
      ))}
    </div>
  );
}
