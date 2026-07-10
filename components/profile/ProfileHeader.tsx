"use client";

import { IdCard, Pencil, Share } from "lucide-react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { IconButton, outlineBtnBase } from "@/components/ui/IconButton";
import type { RankProgress } from "@/lib/xp";

interface ProfileHeaderProps {
  user: {
    id: string;
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
    resolvedAvatarUrl: string;
    followingCount: number;
    followersCount: number;
  };
  isOwnProfile: boolean;
  sharePath: string;
  rank: RankProgress;
  onOpenPassport?: () => void;
}

const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

export function ProfileHeader({
  user,
  isOwnProfile,
  sharePath,
  rank,
  onOpenPassport,
}: ProfileHeaderProps): React.JSX.Element {
  async function handleShare(): Promise<void> {
    const url = user.username
      ? `https://mirubox.vercel.app/u/${user.username}`
      : `${window.location.origin}${sharePath}`;

    if (canNativeShare) {
      try {
        await navigator.share({
          title: `${user.displayName} on mirubox`,
          text: "my ranked and rated",
          url,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // clipboard unavailable
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <header
      style={{
        background: "var(--bg)",
        padding: "20px 0 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <UserAvatar
            userId={user.id}
            username={user.username}
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            size={68}
            borderColor="var(--bg-card-high)"
            borderWidth={2}
          />

          <div style={{ paddingTop: 2, minWidth: 0 }}>
            {user.username ? (
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 11,
                  color: "var(--fg-subtle)",
                  margin: "0 0 2px",
                }}
              >
                @{user.username}
              </p>
            ) : null}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 5,
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontSize: 19,
                  fontWeight: 600,
                  color: "var(--fg)",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                {user.displayName}
              </h1>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 8,
                  fontWeight: 600,
                  color: "var(--primary)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--bg-card-high)",
                  borderRadius: 2,
                  padding: "2px 5px",
                  letterSpacing: "0.04em",
                  transform: "translateY(-1px)",
                }}
              >
                {rank.name}
              </span>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-muted)",
                }}
              >
                <span style={{ color: "var(--fg)", fontWeight: 600 }}>
                  {user.followingCount}
                </span>{" "}
                Following
              </span>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-muted)",
                }}
              >
                <span style={{ color: "var(--fg)", fontWeight: 600 }}>
                  {user.followersCount}
                </span>{" "}
                Followers
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 5,
            paddingTop: 2,
            flexShrink: 0,
          }}
        >
          {isOwnProfile ? (
            <>
              <IconButton href="/settings" aria-label="Edit profile">
                <Pencil size={13} strokeWidth={2} aria-hidden />
              </IconButton>
              <IconButton
                aria-label="View passport"
                onClick={() => onOpenPassport?.()}
              >
                <IdCard size={13} strokeWidth={2} aria-hidden />
              </IconButton>
            </>
          ) : (
            <button
              type="button"
              // TODO: wire up follow when community feature ships
              style={{
                ...outlineBtnBase,
                color: "#fff",
                background: "var(--primary)",
                border: "none",
                padding: "5px 12px",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              FOLLOW
            </button>
          )}
          <IconButton aria-label="Share profile" onClick={() => void handleShare()}>
            <Share size={13} strokeWidth={2} aria-hidden />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
