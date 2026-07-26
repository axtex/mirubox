import type { NotifVisualType } from "@/lib/notification-visuals";

export interface NotificationLinkFields {
  type: NotifVisualType;
  listId: string | null;
  mediaId: number | null;
  fromUser: { username: string | null } | null;
  list: { slug: string } | null;
}

export function getNotificationLinkTarget(
  n: NotificationLinkFields
): string | null {
  switch (n.type) {
    case "BADGE_EARNED":
    case "RANK_UP":
      return "/profile?tab=stats";
    case "LIST_LIKED":
      return n.list?.slug ? `/lists/${n.list.slug}` : null;
    case "NEW_FOLLOWER":
      return n.fromUser?.username ? `/u/${n.fromUser.username}` : null;
    case "EPISODE_AVAILABLE":
      return n.mediaId != null ? `/anime/${n.mediaId}` : null;
    case "CHAPTER_AVAILABLE":
      return n.mediaId != null ? `/manga/${n.mediaId}` : null;
    default:
      return null;
  }
}
