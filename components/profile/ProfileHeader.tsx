"use client";

import { Pencil, Share } from "lucide-react";
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
}

function isCustomAvatarUrl(url: string | null): boolean {
  return Boolean(url && !url.includes("api.dicebear.com"));
}

export function ProfileHeader({
  user,
  isOwnProfile,
  sharePath,
  rank,
}: ProfileHeaderProps): React.JSX.Element {
  async function handleShare(): Promise<void> {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${sharePath}`
        : sharePath;
    const title = `${user.displayName} on mirubox`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelled
      }
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
        padding: "20px 20px 16px",
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
          {isCustomAvatarUrl(user.avatarUrl) ? (
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 2,
                overflow: "hidden",
                border: "2px solid var(--bg-card-high)",
                background: "var(--bg-elevated)",
                flexShrink: 0,
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- uploaded avatar url */}
              <img
                src={user.avatarUrl!}
                alt=""
                width={68}
                height={68}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : (
            <UserAvatar
              userId={user.id}
              username={user.username}
              displayName={user.displayName}
              size={68}
              borderColor="var(--bg-card-high)"
            />
          )}

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
            <IconButton href="/settings" aria-label="Edit profile">
              <Pencil size={13} strokeWidth={2} aria-hidden />
            </IconButton>
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
