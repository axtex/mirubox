"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setLoading(true);
    await signIn("google", { callbackUrl });
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    const res = await signIn("resend", {
      email,
      callbackUrl,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Failed to send magic link. Try again.");
    } else {
      setMagicSent(true);
    }
  }

  return (
    <div
      className="w-full max-w-sm card-base p-8 flex flex-col gap-6"
      style={{ border: "1px solid var(--border)" }}
    >
      {/* Wordmark */}
      <div className="text-center">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-anybody)", color: "var(--fg)" }}
        >
          miru
          <span style={{ color: "var(--accent)" }}>box</span>
        </span>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          Track. Discover. Explore.
        </p>
      </div>

      {magicSent ? (
        <div className="text-center py-4">
          <p style={{ color: "var(--fg)" }} className="font-medium">
            Check your email
          </p>
          <p className="text-sm mt-2" style={{ color: "var(--fg-muted)" }}>
            A magic link was sent to <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <>
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="btn-primary w-full justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
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
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
            <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
          </div>

          {/* Email magic link */}
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            />
            {error && (
              <p className="text-xs" style={{ color: "var(--score-low)" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !email}
              className="btn-ghost w-full justify-center"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
