"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AvatarGlyph } from "@/components/avatar/AvatarGlyph";
import { getAvatarUrl } from "@/lib/avatar";

const MONO = "var(--font-space-mono)";
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

type UsernameStatus = "idle" | "invalid" | "checking" | "available" | "taken";

interface Props {
  userId: string;
  initialDisplayName: string;
  callbackUrl: string;
}

export function OnboardingForm({ userId, initialDisplayName, callbackUrl }: Props) {
  const router = useRouter();
  const { update } = useSession();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [avatarSeed, setAvatarSeed] = useState(userId);
  const [submitting, setSubmitting] = useState(false);

  const checkTimer = useRef<number | undefined>(undefined);
  const avatarTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(avatarTimer.current);
    avatarTimer.current = window.setTimeout(() => {
      setAvatarSeed(username || userId);
    }, 200);
    return () => window.clearTimeout(avatarTimer.current);
  }, [username, userId]);

  useEffect(() => {
    window.clearTimeout(checkTimer.current);

    if (username.length === 0) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    checkTimer.current = window.setTimeout(() => {
      fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`)
        .then((r) => {
          if (r.status === 429) {
            setUsernameStatus("idle");
            return null;
          }
          return r.json() as Promise<{ available: boolean }>;
        })
        .then((data) => {
          if (data) setUsernameStatus(data.available ? "available" : "taken");
        })
        .catch(() => setUsernameStatus("idle"));
    }, 500);

    return () => window.clearTimeout(checkTimer.current);
  }, [username]);

  const canContinue = usernameStatus === "available" && !submitting;

  async function persist(patch: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    onboarded: boolean;
  }) {
    setSubmitting(true);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await update({
        username: patch.username ?? null,
        displayName: patch.displayName ?? null,
        avatarUrl: patch.avatarUrl ?? null,
        onboarded: patch.onboarded,
      });
      router.refresh();
      router.push(callbackUrl);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleContinue() {
    if (!canContinue) return;
    await persist({
      username,
      displayName: displayName.trim() || undefined,
      avatarUrl: getAvatarUrl(username),
      onboarded: true,
    });
  }

  let hintColor = "var(--fg-faint)";
  let hintText = "3-20 chars: lowercase letters, numbers, underscores only.";
  let inputBorder = "var(--bg-card-high)";

  if (usernameStatus === "invalid") {
    hintColor = "var(--primary)";
    hintText = "3-20 chars: lowercase letters, numbers, underscores only.";
    inputBorder = "rgba(232,23,63,0.3)";
  } else if (usernameStatus === "checking") {
    hintColor = "var(--fg-faint)";
    hintText = "Checking…";
  } else if (usernameStatus === "available") {
    hintColor = "var(--success)";
    hintText = `✓ ${username} is available`;
    inputBorder = "var(--success-border)";
  } else if (usernameStatus === "taken") {
    hintColor = "var(--primary)";
    hintText = `${username} is already taken.`;
    inputBorder = "rgba(232,23,63,0.3)";
  }

  return (
    <div className="w-full mx-auto" style={{ maxWidth: 360 }}>
      <p
        style={{
          fontFamily: MONO,
          fontSize: 9,
          color: "var(--fg-faint)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}
      >
        WELCOME TO MIRUBOX
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--fg)", marginBottom: 24 }}>
        Set up your profile
      </h1>

      <div
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-card-high)",
          borderRadius: 2,
          padding: 20,
        }}
      >
        {/* Avatar row */}
        <div
          className="flex items-center"
          style={{
            gap: 14,
            paddingBottom: 16,
            borderBottom: "1px solid var(--bg-card)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 2,
              border: "1px solid var(--bg-card-high)",
              overflow: "hidden",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <AvatarGlyph seed={avatarSeed} size={56} fill />
          </div>
          <div>
            <p
              style={{
                fontFamily: MONO,
                fontSize: 8,
                color: "var(--fg-subtle)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 3,
              }}
            >
              YOUR AVATAR
            </p>
            <p style={{ fontFamily: MONO, fontSize: 9, color: "var(--fg-faint)" }}>
              Auto-generated from your username.
            </p>
          </div>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontFamily: MONO,
              fontSize: 9,
              color: "var(--fg-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            USERNAME
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="Your username"
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: `1px solid ${inputBorder}`,
              borderRadius: 2,
              padding: "9px 12px",
              fontFamily: MONO,
              fontSize: 12,
              color: "var(--fg)",
              outline: "none",
            }}
          />
          <p style={{ fontFamily: MONO, fontSize: 9, color: hintColor, marginTop: 5 }}>{hintText}</p>
        </div>

        {/* Display name */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontFamily: MONO,
              fontSize: 9,
              color: "var(--fg-subtle)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            DISPLAY NAME
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={{
              width: "100%",
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-card-high)",
              borderRadius: 2,
              padding: "9px 12px",
              fontFamily: MONO,
              fontSize: 12,
              color: "var(--fg)",
              outline: "none",
            }}
          />
          <p style={{ fontFamily: MONO, fontSize: 9, color: "var(--fg-faint)", marginTop: 5 }}>
            You can change it later.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!canContinue}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 2,
            padding: "11px 0",
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.06em",
            background: canContinue ? "var(--primary)" : "var(--bg-card-high)",
            color: canContinue ? "#fff" : "var(--fg-subtle)",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? "SAVING…" : "CONTINUE"}
        </button>
      </div>
    </div>
  );
}
