import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="font-display select-none"
        style={{
          fontFamily: "var(--font-anybody)",
          fontSize: "clamp(96px, 20vw, 160px)",
          fontWeight: 800,
          letterSpacing: "-0.06em",
          lineHeight: 1,
          color: "var(--fg-subtle)",
          opacity: 0.25,
        }}
      >
        404
      </div>

      <div className="flex flex-col items-center gap-3">
        <h1
          className="font-display uppercase"
          style={{
            fontFamily: "var(--font-anybody)",
            fontSize: "clamp(16px, 3vw, 22px)",
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "var(--fg)",
          }}
        >
          THIS ARCHIVE ENTRY DOES NOT EXIST.
        </h1>
        <p className="text-label" style={{ color: "var(--fg-subtle)", maxWidth: 320 }}>
          THE FILE YOU&apos;RE LOOKING FOR HAS BEEN MOVED, DELETED, OR NEVER EXISTED.
        </p>
      </div>

      <Link href="/" className="btn-primary">
        RETURN TO ARCHIVE →
      </Link>
    </div>
  );
}
