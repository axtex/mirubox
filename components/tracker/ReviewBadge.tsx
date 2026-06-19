import { ReviewIcon } from "@/components/icons/ReviewIcon";
import type { HTMLAttributes } from "react";
import { TRACKER_BADGE, trackerBadgeBoxStyle, trackerBadgeInactiveReviewStyle, trackerBadgeResetStyle } from "./badgeStyles";

export function getReviewBadgeStyle(hasReview: boolean): React.CSSProperties {
  return {
    ...trackerBadgeResetStyle,
    fontFamily: "var(--font-space-mono)",
    fontSize: TRACKER_BADGE.fontSize,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: hasReview ? "var(--primary)" : "var(--fg-subtle)",
    background: hasReview ? "rgba(232,23,63,0.1)" : "transparent",
    border: hasReview ? "1px solid rgba(232,23,63,0.2)" : "none",
    ...(hasReview ? trackerBadgeBoxStyle : trackerBadgeInactiveReviewStyle),
    cursor: "pointer",
    textDecoration: "none",
  };
}

interface ReviewBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
}

export function ReviewBadge({
  active = false,
  className,
  style,
  ...props
}: ReviewBadgeProps): React.JSX.Element {
  return (
    <span
      className={className}
      style={{ ...getReviewBadgeStyle(active), ...style }}
      {...props}
    >
      <ReviewIcon size={TRACKER_BADGE.iconSize} aria-label={active ? "Review written" : undefined} />
    </span>
  );
}
