import { CheckCircle, Eye, Star, Award } from "lucide-react";
import type { ReactNode } from "react";
import { XPAction, type BadgeKey } from "@prisma/client";
import { ReviewIcon } from "@/components/icons/ReviewIcon";
import { prisma } from "@/lib/prisma";
import { BADGE_DEFINITIONS } from "@/lib/badges";

const ACTIVITY_MEDIA_SELECT = {
  id: true,
  title: true,
  titleEnglish: true,
  type: true,
} as const;

export type ActivityMedia = {
  id: number;
  title: string;
  titleEnglish: string | null;
  type: string;
};

export type ActivityEvent = {
  id: string;
  amount: number;
  action: XPAction;
  reason: string;
  createdAt: Date;
  anime: ActivityMedia | null;
};

const ACTION_LABELS: Record<XPAction, string> = {
  ADD_TO_ARCHIVE: "Added to archive",
  MARK_IN_PROGRESS: "Started watching",
  MARK_COMPLETED: "Marked as completed",
  MARK_COMPLETED_DIRECT: "Added as completed",
  COMPLETE_MOVIE_OVA: "Completed movie/OVA",
  RATE_TITLE: "Rated a title",
  WRITE_REVIEW: "Wrote a review",
  ADD_TO_LIST: "Added to a list",
  CREATE_LIST: "Created a list",
  DAILY_LOGIN: "Daily login",
  LOGIN_STREAK_7: "7-day login streak",
  ADD_FRIEND: "Added a friend",
  INVITE_FRIEND: "Invited a friend",
  FIRST_TITLE: "First title added",
  SEASON_CHALLENGE: "Completed a season challenge",
  BADGE_UNLOCKED: "Badge unlocked",
};

function describeEvent(action: XPAction, meta: unknown): string {
  if (action === "BADGE_UNLOCKED") {
    const badge = (meta as { badge?: BadgeKey } | null)?.badge;
    if (badge && BADGE_DEFINITIONS[badge]) return `Badge unlocked — ${BADGE_DEFINITIONS[badge].name}`;
  }
  return ACTION_LABELS[action];
}

export function activityMediaTitle(anime: ActivityMedia): string {
  return anime.titleEnglish ?? anime.title;
}

export function formatActivityLabel(event: ActivityEvent): string {
  const title = event.anime ? activityMediaTitle(event.anime) : null;
  if (title) return `${title} · ${event.reason}`;
  return event.reason;
}

export async function getRecentActivity(userId: string, limit: number): Promise<ActivityEvent[]> {
  const events = await prisma.xPTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const mediaIds = [...new Set(events.map((e) => e.mediaId).filter((id): id is number => id != null))];
  const animeList = mediaIds.length
    ? await prisma.anime.findMany({ where: { id: { in: mediaIds } }, select: ACTIVITY_MEDIA_SELECT })
    : [];
  const animeMap = new Map(animeList.map((a) => [a.id, a]));

  return events.map((e) => ({
    id: e.id,
    amount: e.amount,
    action: e.action,
    reason: describeEvent(e.action, e.meta),
    createdAt: e.createdAt,
    anime: e.mediaId != null ? (animeMap.get(e.mediaId) ?? null) : null,
  }));
}

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function xpIcon(action: XPAction): ReactNode {
  if (action === "RATE_TITLE") return <Star className="w-4 h-4" />;
  if (action === "WRITE_REVIEW") return <ReviewIcon size={14} />;
  if (action === "BADGE_UNLOCKED") return <Award className="w-4 h-4" />;
  if (action === "MARK_COMPLETED" || action === "MARK_COMPLETED_DIRECT" || action === "COMPLETE_MOVIE_OVA")
    return <CheckCircle className="w-4 h-4" />;
  return <Eye className="w-4 h-4" />;
}
