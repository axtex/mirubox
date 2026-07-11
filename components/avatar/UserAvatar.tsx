"use client";

import { useState } from "react";
import { AvatarGlyph } from "@/components/avatar/AvatarGlyph";
import { getAvatarSeed } from "@/lib/avatar";

interface UserAvatarProps {
  username?: string | null;
  userId: string;
  displayName: string;
  /** Custom upload URL. Dicebear URLs are ignored — glyph is always seeded from username. */
  avatarUrl?: string | null;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
}

function isCustomUpload(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return !url.includes("api.dicebear.com") && !url.includes("dicebear.com");
}

export function UserAvatar({
  username,
  userId,
  displayName,
  avatarUrl = null,
  size = 32,
  borderColor = "var(--bg-card-high)",
  borderWidth = 1,
}: UserAvatarProps): React.JSX.Element {
  const seed = getAvatarSeed(username, userId);
  const [imgFailed, setImgFailed] = useState(false);
  const custom = isCustomUpload(avatarUrl) && !imgFailed;

  return (
    <div
      className="shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 2,
        border: `${borderWidth}px solid ${borderColor}`,
        overflow: "hidden",
        position: "relative",
        background: "var(--bg-elevated)",
      }}
      aria-label={displayName}
    >
      {custom ? (
        // eslint-disable-next-line @next/next/no-img-element -- uploaded avatar url
        <img
          src={avatarUrl!}
          alt=""
          width={size}
          height={size}
          draggable={false}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : isCustomUpload(avatarUrl) ? (
        <div
          className="flex items-center justify-center w-full h-full"
          style={{ fontFamily: "var(--font-space-mono)", fontSize: size * 0.4, color: "var(--fg-subtle)" }}
        >
          {(displayName || "?")[0].toUpperCase()}
        </div>
      ) : (
        <AvatarGlyph seed={seed} size={size} fill />
      )}
    </div>
  );
}
