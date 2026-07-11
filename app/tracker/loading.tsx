import { SearchSkeletonGrid } from "@/components/search/SearchSkeletonGrid";

export default function Loading(): React.JSX.Element {
  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-5">
        <div>
          <div className="shimmer" style={{ height: 28, width: 140, borderRadius: 2, marginBottom: 8 }} />
          <div className="shimmer" style={{ height: 11, width: 110, borderRadius: 2 }} />
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer" style={{ height: 24, width: 70, borderRadius: 2 }} />
        ))}
      </div>

      <SearchSkeletonGrid count={12} />
    </div>
  );
}
