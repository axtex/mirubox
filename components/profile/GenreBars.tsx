const GENRE_COLORS = ["#e8173f", "#534AB7", "#1d9e75", "#BA7517", "#5a5a65", "#e8173f", "#534AB7", "#1d9e75"];

export interface GenreBarItem {
  name: string;
  count: number;
}

interface GenreBarsProps {
  genres: GenreBarItem[];
  emptyMessage?: string;
}

export function GenreBars({
  genres,
  emptyMessage = "Add titles to your tracker to see your taste profile.",
}: GenreBarsProps): React.JSX.Element {
  if (genres.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-faint)",
          textAlign: "center",
          padding: "12px 0",
          margin: 0,
        }}
      >
        {emptyMessage}
      </p>
    );
  }

  const maxCount = genres[0]?.count ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {genres.map((g, i) => (
        <div
          key={g.name}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-muted)",
              minWidth: 88,
              flexShrink: 0,
            }}
          >
            {g.name}
          </span>
          <div
            style={{
              flex: 1,
              height: 3,
              background: "var(--bg-card)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 3,
                borderRadius: 2,
                width: `${Math.round((g.count / maxCount) * 100)}%`,
                background: GENRE_COLORS[i] ?? GENRE_COLORS[4],
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg-faint)",
              minWidth: 16,
              textAlign: "right",
            }}
          >
            {g.count}
          </span>
        </div>
      ))}
    </div>
  );
}
