/** Loading skeleton shared by app/anime/[id]/loading.tsx and app/manga/[id]/loading.tsx. */
export function DetailPageSkeleton(): React.JSX.Element {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Banner */}
      <div className="relative w-full overflow-hidden detail-banner-h">
        <div className="shimmer absolute inset-0" />
      </div>

      {/* Hero — mobile */}
      <div className="md:hidden flex flex-col items-center" style={{ marginTop: -50, paddingBottom: 12 }}>
        <div
          className="shimmer"
          style={{ width: 100, height: 150, borderRadius: 2, border: "2px solid #2a2a2d", marginBottom: 12 }}
        />
        <div className="shimmer" style={{ height: 18, width: "70%", borderRadius: 2, marginBottom: 8 }} />
        <div className="shimmer" style={{ height: 11, width: "40%", borderRadius: 2 }} />
      </div>

      {/* Hero — desktop */}
      <div
        className="hidden md:flex"
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 16,
          marginTop: -80,
          maxWidth: "calc(100% - 248px)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          className="shimmer"
          style={{ width: 110, height: 165, flexShrink: 0, borderRadius: 2, border: "2px solid #2a2a2d" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="shimmer" style={{ height: 22, width: "55%", borderRadius: 2, marginBottom: 8 }} />
          <div className="shimmer" style={{ height: 11, width: "25%", borderRadius: 2, marginBottom: 10 }} />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 20, width: 60, borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-7 py-8" style={{ alignItems: "flex-start" }}>
        {/* Main column */}
        <div className="flex flex-col gap-6 min-w-0" style={{ flex: 1 }}>
          {/* Synopsis */}
          <div className="flex flex-col gap-2">
            {[100, 100, 100, 100, 60].map((w, i) => (
              <div key={i} className="shimmer" style={{ height: 11, width: `${w}%`, borderRadius: 2 }} />
            ))}
          </div>

          {/* Characters row */}
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ flexShrink: 0, width: 70 }}>
                <div className="shimmer" style={{ width: 70, height: 70, borderRadius: "50%", marginBottom: 6 }} />
                <div className="shimmer" style={{ height: 9, width: "80%", borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden md:block" style={{ width: 220, flexShrink: 0 }}>
          <div className="shimmer" style={{ height: 120, borderRadius: 2, marginBottom: 16 }} />
          <div className="shimmer" style={{ height: 160, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}
