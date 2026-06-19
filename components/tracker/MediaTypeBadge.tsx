import type { HTMLAttributes } from "react";
import { TRACKER_BADGE, trackerBadgeBoxStyle } from "./badgeStyles";

export function getMediaTypeBadgeStyle(isManga: boolean): React.CSSProperties {
  return {
    ...trackerBadgeBoxStyle,
    height: TRACKER_BADGE.minHeight,
    padding: "4px 5px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "var(--font-space-mono)",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.05em",
    lineHeight: 1,
    color: isManga ? "#a78bfa" : "#60a5fa",
    background: isManga ? "rgba(167,139,250,0.15)" : "rgba(96,165,250,0.15)",
    border: `1px solid ${isManga ? "rgba(167,139,250,0.25)" : "rgba(96,165,250,0.25)"}`,
    backdropFilter: "blur(4px)",
  };
}

interface MediaTypeBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  mediaType: string;
}

export function MediaTypeBadge({
  mediaType,
  className = "shrink-0",
  style,
  ...rest
}: MediaTypeBadgeProps): React.JSX.Element {
  const isManga = mediaType === "MANGA";

  return (
    <span
      className={className}
      style={{ ...getMediaTypeBadgeStyle(isManga), ...style }}
      {...rest}
    >
      {isManga ? "MANGA" : "ANIME"}
    </span>
  );
}
