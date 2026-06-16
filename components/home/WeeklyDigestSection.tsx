export function WeeklyDigestSection() {
  return (
    <section className="px-4 md:px-8">
      <div
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 md:p-12"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, var(--bg-card-high) 0%, var(--bg-surface) 70%)",
          border: "1px solid var(--border-bright)",
          borderRadius: 4,
        }}
      >
        <div className="flex-1">
          <h2 className="text-headline-md font-display uppercase">WEEKLY CINEMATIC DIGEST</h2>
          <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)", maxWidth: 400 }}>
            Seasonal rankings, studio spotlights, and rare gems delivered.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="email"
            placeholder="YOUR EMAIL"
            readOnly
            className="flex-1 md:w-64 px-4 py-3 outline-none"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-bright)",
              borderRadius: 2,
              color: "var(--fg)",
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
            }}
          />
          <button type="button" className="btn-primary whitespace-nowrap">
            TRANSMIT
          </button>
        </div>
      </div>
    </section>
  );
}
