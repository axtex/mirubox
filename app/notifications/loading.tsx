export default function NotificationsLoading(): React.JSX.Element {
  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mb-5">
        <div
          className="shimmer"
          style={{ height: 28, width: 180, borderRadius: 2 }}
        />
      </div>
      <div>
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="flex items-start"
            style={{
              gap: 10,
              padding: "12px 16px",
              borderBottom: "1px solid var(--bg-card)",
            }}
          >
            <div
              className="shimmer shrink-0"
              style={{ width: 28, height: 28, borderRadius: 2 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="shimmer"
                style={{ height: 12, width: "70%", borderRadius: 2, marginBottom: 6 }}
              />
              <div
                className="shimmer"
                style={{ height: 9, width: "45%", borderRadius: 2 }}
              />
            </div>
            <div
              className="shimmer shrink-0"
              style={{ height: 8, width: 28, borderRadius: 2, marginTop: 2 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
