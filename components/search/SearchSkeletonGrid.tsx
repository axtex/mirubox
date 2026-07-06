const GRID = "grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3";

function SearchCardSkeleton() {
  return (
    <div className="anime-card anime-card--md" style={{ borderRadius: 4, overflow: "hidden" }}>
      <div className="shimmer w-full aspect-[2/3]" style={{ borderRadius: 4, marginBottom: 6 }} />
      <div className="shimmer" style={{ height: 10, width: "80%", borderRadius: 2, marginBottom: 4 }} />
      <div className="shimmer" style={{ height: 8, width: "50%", borderRadius: 2 }} />
    </div>
  );
}

export function SearchSkeletonGrid({ count = 14 }: { count?: number }) {
  return (
    <div className={GRID}>
      {Array.from({ length: count }).map((_, i) => (
        <SearchCardSkeleton key={i} />
      ))}
    </div>
  );
}
