import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings — mirubox",
};

export default function SettingsPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col items-center gap-3">
        <h1
          className="font-display uppercase"
          style={{
            fontFamily: "var(--font-anybody)",
            fontSize: "clamp(20px, 4vw, 32px)",
            fontWeight: 800,
            letterSpacing: "0.05em",
            color: "var(--fg)",
          }}
        >
          SETTINGS
        </h1>
        <p className="text-label" style={{ color: "var(--fg-subtle)", maxWidth: 360 }}>
          ACCOUNT SETTINGS AND PREFERENCES ARE COMING SOON.
        </p>
      </div>
      <Link href="/profile" className="btn-ghost" style={{ fontSize: 10 }}>
        ← BACK TO PROFILE
      </Link>
    </div>
  );
}
