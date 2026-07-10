"use client";

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
  const custom = isCustomUpload(avatarUrl);

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
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <AvatarGlyph seed={seed} size={size} fill />
      )}
    </div>
  );
}
