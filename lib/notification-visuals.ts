export type NotifVisualType =
  | "BADGE_EARNED"
  | "RANK_UP"
  | "LIST_LIKED"
  | "NEW_FOLLOWER"
  | "EPISODE_AVAILABLE"
  | "XP"
  | "ERROR";

interface NotifVisual {
  bg: string;
  border: string;
  emoji: string;
}

const BASE: Record<Exclude<NotifVisualType, "RANK_UP">, NotifVisual> = {
  BADGE_EARNED: { bg: "rgba(232,200,100,0.1)", border: "rgba(232,200,100,0.2)", emoji: "🏅" },
  LIST_LIKED: { bg: "rgba(232,23,63,0.1)", border: "rgba(232,23,63,0.2)", emoji: "♥" },
  NEW_FOLLOWER: { bg: "rgba(100,180,230,0.1)", border: "rgba(100,180,230,0.2)", emoji: "👤" },
  EPISODE_AVAILABLE: { bg: "rgba(100,180,230,0.1)", border: "rgba(100,180,230,0.2)", emoji: "▶" },
  XP: { bg: "rgba(83,74,183,0.1)", border: "rgba(83,74,183,0.2)", emoji: "⚡" },
  ERROR: { bg: "rgba(232,23,63,0.1)", border: "rgba(232,23,63,0.3)", emoji: "✕" },
};

// RANK_UP body is stored as "<emoji> <rankName> unlocked" — the emoji is read back out of it
// rather than duplicating the rank→emoji table on the client (which would require bundling
// lib/xp.ts, a server module that imports the Prisma client).
export function getNotifVisual(type: NotifVisualType, body?: string | null): NotifVisual {
  if (type === "RANK_UP") {
    const emoji = body?.trim().split(" ")[0] || "⚡";
    return { bg: "rgba(232,23,63,0.1)", border: "rgba(232,23,63,0.2)", emoji };
  }
  return BASE[type];
}
