interface AnimeCardSkeletonProps {
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { width: 100, height: 150 },
  md: { width: 140, height: 210 },
  lg: { width: 180, height: 270 },
};

export function AnimeCardSkeleton({ size = "md" }: AnimeCardSkeletonProps) {
  const { width, height } = SIZES[size];

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <div className="shimmer" style={{ height, width }} />
    </div>
  );
}
