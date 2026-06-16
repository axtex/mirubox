interface AnimeCardSkeletonProps {
  size?: "sm" | "md" | "lg";
}

export function AnimeCardSkeleton({ size = "md" }: AnimeCardSkeletonProps) {
  return (
    <div
      className={`anime-card anime-card--${size}`}
      style={{
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <div className="shimmer w-full aspect-[2/3]" />
    </div>
  );
}
