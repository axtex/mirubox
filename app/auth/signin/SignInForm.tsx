"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const MONO = "var(--font-space-mono)";

export function SignInForm(): React.JSX.Element {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle(): Promise<void> {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="w-full flex flex-col items-center" style={{ maxWidth: 320 }}>
      <div
        style={{
          width: "100%",
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-card-high)",
          borderRadius: 2,
          padding: 24,
        }}
      >
        <div className="text-center" style={{ marginBottom: 20 }}>
          <span
            style={{
              fontFamily: "var(--font-anybody)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--fg)",
            }}
          >
            miru
            <span style={{ color: "var(--primary)" }}>box</span>
          </span>
          <p style={{ fontFamily: MONO, fontSize: 10, color: "var(--fg-subtle)", fontStyle: "italic", marginTop: 6 }}>
            Track what you watch. Discover what&apos;s next.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={googleLoading}
          style={{
            width: "100%",
            background: "#fff",
            border: "none",
            borderRadius: 2,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: googleLoading ? "default" : "pointer",
          }}
        >
          <GoogleMark />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: "#131316" }}>
            {googleLoading ? "Redirecting…" : "Continue with Google"}
          </span>
        </button>
      </div>
    </div>
  );
}

function GoogleMark(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
