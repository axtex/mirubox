import { AnimeCardSkeleton } from "@/components/anime/AnimeCardSkeleton";

/** Shared skeleton for home / anime / manga browse transitions. */
export function BrowsePageSkeleton({
  showHero = false,
  rows = 3,
}: {
  showHero?: boolean;
  rows?: number;
}): React.JSX.Element {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {showHero && (
        <div
          className="shimmer w-full"
          style={{ aspectRatio: "21 / 9", maxHeight: 420, minHeight: 200 }}
        />
      )}
      <div className="flex flex-col" style={{ gap: 72, paddingTop: 56, paddingBottom: 56 }}>
        {Array.from({ length: rows }, (_, row) => (
          <section key={row}>
            <div className="section-header">
              <div className="section-header-row">
                <div className="shimmer" style={{ height: 22, width: 160, borderRadius: 2 }} />
              </div>
              <div className="section-underline" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 7 }, (_, i) => (
                <AnimeCardSkeleton key={i} size="md" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
