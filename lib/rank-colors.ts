export const RANK_COLORS: Record<string, { accent: string; bgStart: string }> = {
  WATCHER: { accent: "#e8173f", bgStart: "#12061e" },
  TRACKER: { accent: "#4a90d9", bgStart: "#06121e" },
  ARCHIVIST: { accent: "#1d9e75", bgStart: "#06120a" },
  CURATOR: { accent: "#BA7517", bgStart: "#1a1008" },
  SCHOLAR: { accent: "#534AB7", bgStart: "#0a0a1e" },
  SAGE: { accent: "#a050e8", bgStart: "#14061e" },
  LEGEND: { accent: "#ffb400", bgStart: "#1a1000" },
};

export function getRankColors(rankName: string): { accent: string; bgStart: string } {
  return RANK_COLORS[rankName] ?? RANK_COLORS.WATCHER;
}
