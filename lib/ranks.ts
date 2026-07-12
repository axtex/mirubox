export const RANKS = [
  { name: "WATCHER", min: 0, emoji: "👁" },
  { name: "TRACKER", min: 100, emoji: "📌" },
  { name: "ARCHIVIST", min: 500, emoji: "📂" },
  { name: "CURATOR", min: 1000, emoji: "🎯" },
  { name: "SCHOLAR", min: 2000, emoji: "⚡" },
  { name: "SAGE", min: 3500, emoji: "🔮" },
  { name: "LEGEND", min: 5000, emoji: "👑" },
] as const;

export type RankName = (typeof RANKS)[number]["name"];

export function computeRank(totalXP: number): RankName {
  const rank = [...RANKS].reverse().find((r) => totalXP >= r.min);
  return rank?.name ?? "WATCHER";
}

export interface RankProgress {
  name: RankName;
  emoji: string;
  minXP: number;
  nextName: RankName | null;
  nextMinXP: number | null;
  progressPct: number;
  isMax: boolean;
}

export function getRankProgress(totalXP: number): RankProgress {
  const index = [...RANKS].reverse().findIndex((r) => totalXP >= r.min);
  const rankIndex = index === -1 ? 0 : RANKS.length - 1 - index;
  const current = RANKS[rankIndex] ?? RANKS[0];
  const next = RANKS[rankIndex + 1] ?? null;
  const progressPct = next
    ? Math.min(100, Math.max(0, ((totalXP - current.min) / (next.min - current.min)) * 100))
    : 100;

  return {
    name: current.name,
    emoji: current.emoji,
    minXP: current.min,
    nextName: next?.name ?? null,
    nextMinXP: next?.min ?? null,
    progressPct,
    isMax: !next,
  };
}
