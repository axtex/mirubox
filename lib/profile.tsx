import { CheckCircle, Eye, Star } from "lucide-react";
import type { ReactNode } from "react";
import { ReviewIcon } from "@/components/icons/ReviewIcon";
import { prisma } from "@/lib/prisma";

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
  reason: string;
  createdAt: Date;
  anime: ActivityMedia | null;
};

export function activityMediaTitle(anime: ActivityMedia): string {
  return anime.titleEnglish ?? anime.title;
}

export function formatActivityLabel(event: ActivityEvent): string {
  const title = event.anime ? activityMediaTitle(event.anime) : null;
  if (title) return `${title} · ${event.reason}`;
  return event.reason;
}

export async function getRecentActivity(userId: string, limit: number): Promise<ActivityEvent[]> {
  return prisma.xpEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { anime: { select: ACTIVITY_MEDIA_SELECT } },
  });
}

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function xpIcon(reason: string): ReactNode {
  if (reason.toLowerCase().includes("rate")) return <Star className="w-4 h-4" />;
  if (reason.toLowerCase().includes("review")) return <ReviewIcon size={14} />;
  if (reason.toLowerCase().includes("complet")) return <CheckCircle className="w-4 h-4" />;
  return <Eye className="w-4 h-4" />;
}
