/** Loading skeleton shared by app/profile/loading.tsx and app/u/[username]/loading.tsx. */
export function ProfilePageSkeleton(): React.JSX.Element {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ padding: "20px 0 16px" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div className="shimmer shrink-0" style={{ width: 68, height: 68, borderRadius: 2 }} />
          <div style={{ paddingTop: 2, flex: 1 }}>
            <div className="shimmer" style={{ height: 10, width: 80, borderRadius: 2, marginBottom: 8 }} />
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <div className="shimmer" style={{ height: 19, width: 140, borderRadius: 2 }} />
              <div className="shimmer" style={{ height: 15, width: 50, borderRadius: 2 }} />
            </div>
            <div className="flex gap-3">
              <div className="shimmer" style={{ height: 10, width: 70, borderRadius: 2 }} />
              <div className="shimmer" style={{ height: 10, width: 70, borderRadius: 2 }} />
            </div>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div
        className="flex gap-4"
        style={{ borderTop: "1px solid var(--bg-card)", borderBottom: "1px solid var(--bg-card)", padding: "10px 0" }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 10, width: 50, borderRadius: 2 }} />
        ))}
      </div>

      {/* Content placeholders */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3" style={{ paddingTop: 20 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ borderRadius: 4, aspectRatio: "2/3" }} />
        ))}
      </div>
    </div>
  );
}
