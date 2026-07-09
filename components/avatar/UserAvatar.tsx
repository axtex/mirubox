"use client";

import { AvatarGlyph } from "@/components/avatar/AvatarGlyph";
import { getAvatarSeed } from "@/lib/avatar";

interface UserAvatarProps {
  username?: string | null;
  userId: string;
  displayName: string;
  size?: number;
  borderColor?: string;
}

export function UserAvatar({
  username,
  userId,
  displayName,
  size = 32,
  borderColor = "var(--bg-card-high)",
}: UserAvatarProps): React.JSX.Element {
  const seed = getAvatarSeed(username, userId);
  const showGlyph = Boolean(username?.trim());

  if (!showGlyph) {
    return (
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          fontFamily: "var(--font-space-mono)",
          fontSize: size <= 32 ? 11 : 24,
          fontWeight: 700,
          color: "var(--primary)",
        }}
        aria-hidden
      >
        {displayName[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <div
      className="shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 2,
        border: `1px solid ${borderColor}`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <AvatarGlyph seed={seed} size={size} fill />
    </div>
  );
}
