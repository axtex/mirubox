import type { ActivityAction, ActivityItem } from "@/lib/profile-types";

export type IconStyle = {
  icon: string;
  bg: string;
  border: string;
};

export function actionIcon(action: ActivityAction): IconStyle {
  switch (action) {
    case "FOLLOWING":
    case "NEW_FOLLOWER":
      return {
        icon: "👤",
        bg: "rgba(100,180,230,0.1)",
        border: "rgba(100,180,230,0.2)",
      };
    case "LIST_LIKED":
    case "LIST_GOT_LIKED":
      return {
        icon: "♥",
        bg: "rgba(232,23,63,0.1)",
        border: "rgba(232,23,63,0.2)",
      };
    case "ADD_TO_TRACKER":
    case "MARK_IN_PROGRESS":
    case "FIRST_TITLE":
      return {
        icon: "+",
        bg: "rgba(29,158,117,0.12)",
        border: "rgba(29,158,117,0.25)",
      };
    case "MARK_COMPLETED":
    case "MARK_COMPLETED_DIRECT":
    case "COMPLETE_MOVIE_OVA":
      return {
        icon: "✓",
        bg: "rgba(83,74,183,0.15)",
        border: "rgba(83,74,183,0.3)",
      };
    case "RATE_TITLE":
      return {
        icon: "★",
        bg: "rgba(232,23,63,0.1)",
        border: "rgba(232,23,63,0.2)",
      };
    case "WRITE_REVIEW":
      return {
        icon: "✍",
        bg: "rgba(186,117,23,0.1)",
        border: "rgba(186,117,23,0.2)",
      };
    case "BADGE_UNLOCKED":
      return {
        icon: "🏅",
        bg: "rgba(232,200,100,0.1)",
        border: "rgba(232,200,100,0.2)",
      };
    case "CREATE_LIST":
    case "ADD_TO_LIST":
      return {
        icon: "📋",
        bg: "rgba(100,180,230,0.1)",
        border: "rgba(100,180,230,0.2)",
      };
    case "DAILY_LOGIN":
      return {
        icon: "📅",
        bg: "rgba(100,180,230,0.1)",
        border: "rgba(100,180,230,0.2)",
      };
    default:
      return {
        icon: "·",
        bg: "var(--bg-elevated)",
        border: "var(--bg-card-high)",
      };
  }
}

function mediaTitle(item: ActivityItem): string | null {
  if (!item.media) return null;
  return item.media.titleEnglish ?? item.media.title;
}

export type ActionText = {
  prefix: string;
  highlight: string | null;
  suffix?: string;
};

export function actionText(item: ActivityItem): ActionText {
  const title = mediaTitle(item);
  const userName = item.relatedUser?.displayName ?? null;

  switch (item.action) {
    case "FOLLOWING":
      return { prefix: "Followed ", highlight: userName };
    case "NEW_FOLLOWER":
      return { prefix: "", highlight: userName, suffix: " followed you" };
    case "LIST_LIKED":
      return { prefix: "Liked list ", highlight: item.listTitle };
    case "LIST_GOT_LIKED":
      if (item.listTitle) {
        return {
          prefix: `${userName ?? "Someone"} liked `,
          highlight: item.listTitle,
        };
      }
      return {
        prefix: `${userName ?? "Someone"} liked your list`,
        highlight: null,
      };
    case "ADD_TO_TRACKER":
    case "FIRST_TITLE":
      return { prefix: "Added ", highlight: title, suffix: " to tracker" };
    case "MARK_IN_PROGRESS":
      return { prefix: "Started ", highlight: title };
    case "MARK_COMPLETED":
    case "MARK_COMPLETED_DIRECT":
    case "COMPLETE_MOVIE_OVA":
      return { prefix: "Completed ", highlight: title };
    case "RATE_TITLE":
      return { prefix: "Rated ", highlight: title };
    case "WRITE_REVIEW":
      return { prefix: "Wrote a review for ", highlight: title };
    case "BADGE_UNLOCKED":
      return { prefix: "Earned badge ", highlight: item.badgeName };
    case "CREATE_LIST":
      return { prefix: "Created list ", highlight: item.listTitle };
    case "ADD_TO_LIST":
      return {
        prefix: "Added ",
        highlight: title,
        suffix: item.listTitle ? ` to ${item.listTitle}` : " to a list",
      };
    case "DAILY_LOGIN":
      return { prefix: "Daily Login", highlight: null };
    default:
      return {
        prefix: item.action.replaceAll("_", " ").toLowerCase(),
        highlight: title,
      };
  }
}

export function socialActionText(item: ActivityItem): ActionText {
  const title = mediaTitle(item);
  const meta = item.meta;

  switch (item.action) {
    case "ADD_TO_TRACKER":
    case "FIRST_TITLE":
      return { prefix: "added ", highlight: title, suffix: " to archive" };
    case "MARK_IN_PROGRESS":
      return { prefix: "started ", highlight: title };
    case "MARK_COMPLETED":
    case "MARK_COMPLETED_DIRECT":
    case "COMPLETE_MOVIE_OVA":
      return { prefix: "completed ", highlight: title };
    case "RATE_TITLE": {
      const score = typeof meta?.score === "number" ? meta.score : null;
      return {
        prefix: "rated ",
        highlight: title,
        suffix: score != null ? ` ${score}/10` : undefined,
      };
    }
    case "WRITE_REVIEW":
      return { prefix: "wrote a review for ", highlight: title };
    case "BADGE_UNLOCKED":
      return { prefix: "earned badge ", highlight: item.badgeName };
    case "CREATE_LIST":
      return { prefix: "created list ", highlight: item.listTitle };
    case "ADD_TO_LIST":
      return {
        prefix: "added ",
        highlight: title,
        suffix: item.listTitle ? ` to ${item.listTitle}` : " to a list",
      };
    case "DAILY_LOGIN":
      return { prefix: "logged in", highlight: null };
    default:
      return actionText(item);
  }
}

export function subText(item: ActivityItem): string | null {
  if (item.action === "FOLLOWING" || item.action === "NEW_FOLLOWER") {
    return item.relatedUser?.username ? `@${item.relatedUser.username}` : null;
  }
  if (item.action === "LIST_LIKED" && item.relatedUser) {
    return `by ${item.relatedUser.displayName}`;
  }
  if (item.action === "LIST_GOT_LIKED" && item.relatedUser?.username) {
    return `@${item.relatedUser.username}`;
  }
  if (item.action === "LIST_LIKED" || item.action === "LIST_GOT_LIKED") {
    if (item.listEntryCount != null) {
      const vis = item.listIsPublic ? "Public" : "Private";
      return `${item.listEntryCount} titles · ${vis}`;
    }
  }

  const meta = item.meta;
  if (item.action === "MARK_IN_PROGRESS" || item.action === "ADD_TO_TRACKER") {
    const from = typeof meta?.from === "number" ? meta.from : null;
    const to =
      typeof meta?.to === "number"
        ? meta.to
        : typeof meta?.progress === "number"
          ? meta.progress
          : null;
    if (from != null && to != null) {
      const unit = item.media?.type === "MANGA" ? "CH" : "EP";
      return `${unit} ${from} → ${to}`;
    }
  }
  if (
    item.action === "MARK_COMPLETED" ||
    item.action === "MARK_COMPLETED_DIRECT" ||
    item.action === "COMPLETE_MOVIE_OVA"
  ) {
    const total =
      item.media?.type === "MANGA"
        ? item.media.chapters
        : item.media?.episodes;
    if (total) {
      const unit = item.media?.type === "MANGA" ? "chapters" : "episodes";
      return `${total} / ${total} ${unit}`;
    }
  }
  if (item.action === "RATE_TITLE") {
    const score = typeof meta?.score === "number" ? meta.score : null;
    if (score != null) return `${score} / 10`;
  }
  if (item.action === "BADGE_UNLOCKED" && item.badgeDescription) {
    return item.badgeDescription;
  }
  if (
    (item.action === "CREATE_LIST" || item.action === "ADD_TO_LIST") &&
    item.listEntryCount != null
  ) {
    const vis = item.listIsPublic ? "Public" : "Private";
    return `${item.listEntryCount} titles · ${vis}`;
  }
  return null;
}

export function dateBucket(date: Date | string, now: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);

  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";
  if (diffDays < 7) return "THIS WEEK";
  if (diffDays < 30) return "THIS MONTH";
  return "EARLIER";
}

export const BUCKET_ORDER = [
  "TODAY",
  "YESTERDAY",
  "THIS WEEK",
  "THIS MONTH",
  "EARLIER",
] as const;
