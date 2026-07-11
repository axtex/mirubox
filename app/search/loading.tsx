import { SearchSkeletonGrid } from "@/components/search/SearchSkeletonGrid";

export default function Loading(): React.JSX.Element {
  return (
    <div className="py-12 min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="shimmer" style={{ height: 40, width: "100%", maxWidth: 480, borderRadius: 2, marginBottom: 24 }} />
      <SearchSkeletonGrid count={8} />
    </div>
  );
}
