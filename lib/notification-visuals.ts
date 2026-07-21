import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Crown,
  Heart,
  Medal,
  Play,
  UserPlus,
  X,
  Zap,
} from "lucide-react";

export type NotifVisualType =
  | "BADGE_EARNED"
  | "RANK_UP"
  | "LIST_LIKED"
  | "NEW_FOLLOWER"
  | "EPISODE_AVAILABLE"
  | "CHAPTER_AVAILABLE"
  | "XP"
  | "ERROR";

export interface NotifVisual {
  bg: string;
  border: string;
  Icon: LucideIcon;
}

const BASE: Record<Exclude<NotifVisualType, "RANK_UP">, NotifVisual> = {
  BADGE_EARNED: {
    bg: "rgba(232,200,100,0.22)",
    border: "rgba(232,200,100,0.4)",
    Icon: Medal,
  },
  LIST_LIKED: {
    bg: "rgba(232,23,63,0.22)",
    border: "rgba(232,23,63,0.4)",
    Icon: Heart,
  },
  NEW_FOLLOWER: {
    bg: "rgba(100,180,230,0.22)",
    border: "rgba(100,180,230,0.4)",
    Icon: UserPlus,
  },
  EPISODE_AVAILABLE: {
    bg: "rgba(100,180,230,0.22)",
    border: "rgba(100,180,230,0.4)",
    Icon: Play,
  },
  CHAPTER_AVAILABLE: {
    bg: "rgba(29,158,117,0.22)",
    border: "rgba(29,158,117,0.4)",
    Icon: BookOpen,
  },
  XP: {
    bg: "rgba(83,74,183,0.22)",
    border: "rgba(83,74,183,0.4)",
    Icon: Zap,
  },
  ERROR: {
    bg: "rgba(232,23,63,0.22)",
    border: "rgba(232,23,63,0.45)",
    Icon: X,
  },
};

const RANK_UP: NotifVisual = {
  bg: "rgba(232,23,63,0.22)",
  border: "rgba(232,23,63,0.4)",
  Icon: Crown,
};

export function getNotifVisual(type: NotifVisualType): NotifVisual {
  if (type === "RANK_UP") return RANK_UP;
  return BASE[type];
}

/** Strip leading rank emoji from legacy RANK_UP bodies ("👑 LEGEND unlocked"). */
export function notifBodyText(
  type: NotifVisualType,
  body?: string | null
): string | null {
  if (!body) return null;
  if (type === "RANK_UP") {
    const stripped = body.replace(/^\S+\s+/, "").trim();
    return stripped || body;
  }
  return body;
}
