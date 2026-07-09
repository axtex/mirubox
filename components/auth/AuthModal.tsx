"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";
import { useAuthModalState } from "@/context/AuthModalContext";

type ModalState = "default" | "sent";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MONO = "var(--font-space-mono)";

export function AuthModal() {
  const { isOpen, options, closeAuthModal } = useAuthModalState();
  const pathname = usePathname();
  const [state, setState] = useState<ModalState>("default");
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  const shellRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const hiddenOnRoute = pathname === "/auth/signin" || pathname?.startsWith("/onboarding");

  useEffect(() => {
    if (isOpen) {
      setState("default");
      setEmail("");
      setGoogleLoading(false);
      setMagicLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (state !== "sent") closeAuthModal();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = shellRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const list = Array.from(focusables);
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, state, closeAuthModal]);

  if (!isOpen || hiddenOnRoute) return null;

  const callbackUrl = options.callbackUrl ?? pathname ?? "/";

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email) || magicLoading) return;
    setMagicLoading(true);
    await signIn("resend", { email, callbackUrl, redirect: false });
    setMagicLoading(false);
    setState("sent");
  }

  const modal = (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current && state !== "sent") closeAuthModal();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        className="auth-modal-shell"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
          width: "calc(100% - 32px)",
          maxWidth: 320,
          position: "relative",
          padding: 24,
        }}
      >
        {state !== "sent" && (
          <div className="flex items-center justify-between" style={{ margin: "-8px 0 16px" }}>
            <span
              style={{
                fontFamily: "var(--font-anybody)",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--fg)",
                lineHeight: 1,
              }}
            >
              miru
              <span style={{ color: "var(--primary)" }}>box</span>
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={closeAuthModal}
              className="review-modal-close"
            >
              ×
            </button>
          </div>
        )}

        {state === "default" && (
          <DefaultState
            email={email}
            setEmail={setEmail}
            googleLoading={googleLoading}
            magicLoading={magicLoading}
            onGoogle={() => void handleGoogle()}
            onMagicLink={(e) => void handleSendMagicLink(e)}
          />
        )}

        {state === "sent" && (
          <SentState
            email={email}
            onTryAnother={() => {
              setState("default");
              setEmail("");
            }}
          />
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function DefaultState({
  email,
  setEmail,
  googleLoading,
  magicLoading,
  onGoogle,
  onMagicLink,
}: {
  email: string;
  setEmail: (v: string) => void;
  googleLoading: boolean;
  magicLoading: boolean;
  onGoogle: () => void;
  onMagicLink: (e: React.FormEvent) => void;
}) {
  const valid = EMAIL_REGEX.test(email);

  return (
    <>
      <p
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: "var(--fg-muted)",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Sign in to get started.
      </p>

      <button
        type="button"
        onClick={onGoogle}
        disabled={googleLoading}
        style={{
          width: "100%",
          background: "#fff",
          border: "none",
          borderRadius: 2,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: googleLoading ? "default" : "pointer",
          marginBottom: 8,
        }}
      >
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
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, color: "#131316" }}>
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </span>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--bg-card-high)" }} />
        <span style={{ fontFamily: MONO, fontSize: 9, color: "var(--bg-card-high)" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--bg-card-high)" }} />
      </div>

      <form onSubmit={onMagicLink}>
        <div className="auth-email-disabled-wrapper" style={{ marginBottom: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            readOnly
            tabIndex={0}
            aria-label="Email"
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-card-high)",
              borderRadius: 2,
              padding: "9px 12px",
              fontFamily: MONO,
              fontSize: 11,
              color: "var(--fg)",
              outline: "none",
              opacity: 0.4,
              cursor: "not-allowed",
              display: "block",
            }}
          />
          <div className="auth-email-disabled-tooltip">Coming soon</div>
        </div>

        <div style={{ opacity: 0.4, pointerEvents: "none", userSelect: "none" }}>
          <button
            type="submit"
            disabled={!valid || magicLoading}
            style={{
              width: "100%",
              borderRadius: 2,
              border: "none",
              padding: "9px 0",
              fontFamily: MONO,
              fontSize: 10,
              fontWeight: 600,
              background: valid ? "var(--primary)" : "var(--bg-card-high)",
              color: valid ? "#fff" : "var(--fg-subtle)",
              cursor: valid && !magicLoading ? "pointer" : "not-allowed",
            }}
          >
            {magicLoading ? "SENDING…" : "SEND SIGN-IN LINK"}
          </button>

          <p
            style={{
              fontFamily: MONO,
              fontSize: 9,
              color: "var(--fg-faint)",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            No password needed.
          </p>
        </div>
      </form>
    </>
  );
}

function SentState({ email, onTryAnother }: { email: string; onTryAnother: () => void }) {
  return (
    <div className="text-center" style={{ padding: "8px 0" }}>
      <Mail size={26} style={{ color: "var(--fg-muted)", marginBottom: 12 }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 8 }}>
        Check your inbox
      </p>
      <p style={{ fontFamily: MONO, fontSize: 10, color: "var(--fg-subtle)", lineHeight: 1.8 }}>
        We sent a sign-in link to
        <br />
        <span style={{ color: "var(--fg)" }}>{email}</span>
      </p>
      <p style={{ fontFamily: MONO, fontSize: 9, color: "var(--fg-faint)", marginTop: 14 }}>
        Didn&apos;t get it? Check spam or{" "}
        <button
          type="button"
          onClick={onTryAnother}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: MONO,
            fontSize: 9,
            color: "var(--fg-faint)",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          try another email →
        </button>
      </p>
    </div>
  );
}
