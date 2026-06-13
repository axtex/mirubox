interface AnimeCardSkeletonProps {
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { width: 120, height: 170 },
  md: { width: 160, height: 225 },
  lg: { width: 200, height: 285 },
};

export function AnimeCardSkeleton({ size = "md" }: AnimeCardSkeletonProps) {
  const { width, height } = SIZES[size];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        width,
        flexShrink: 0,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="skeleton" style={{ height, width }} />
      <div className="px-2 py-2 flex flex-col gap-1.5">
        <div className="skeleton h-3 rounded" style={{ width: "80%" }} />
        <div className="skeleton h-2.5 rounded" style={{ width: "50%" }} />
      </div>
    </div>
  );
}
