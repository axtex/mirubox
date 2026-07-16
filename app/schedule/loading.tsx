function EntryRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center" style={{ gap: 10, padding: "8px 0" }}>
      <div
        className="shimmer shrink-0"
        style={{ width: 32, aspectRatio: "2 / 3", borderRadius: 2 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="shimmer" style={{ height: 12, width: "70%", borderRadius: 2, marginBottom: 6 }} />
        <div className="shimmer" style={{ height: 9, width: "40%", borderRadius: 2 }} />
      </div>
      <div className="shimmer shrink-0" style={{ height: 9, width: 36, borderRadius: 2 }} />
    </div>
  );
}

function GroupSkeleton({ rows }: { rows: number }): React.JSX.Element {
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="shimmer" style={{ height: 9, width: 64, borderRadius: 2, marginBottom: 8 }} />
      {Array.from({ length: rows }, (_, i) => (
        <EntryRowSkeleton key={i} />
      ))}
    </div>
  );
}

export default function ScheduleLoading(): React.JSX.Element {
  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mb-5">
        <div className="shimmer" style={{ height: 28, width: 140, borderRadius: 2 }} />
      </div>

      <div className="flex gap-1.5 mb-5">
        <div className="shimmer" style={{ height: 28, width: 100, borderRadius: 2 }} />
        <div className="shimmer" style={{ height: 28, width: 140, borderRadius: 2 }} />
      </div>

      <GroupSkeleton rows={3} />
      <GroupSkeleton rows={2} />
      <GroupSkeleton rows={2} />
      <GroupSkeleton rows={3} />
    </div>
  );
}
