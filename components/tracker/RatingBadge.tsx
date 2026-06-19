import { Star } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import { TRACKER_BADGE, TRACKER_RATING_BADGE_MIN_WIDTH, trackerBadgeBoxStyle, trackerBadgeResetStyle } from "./badgeStyles";

export function getRatingBadgeStyle(hasScore: boolean): React.CSSProperties {
  return {
    ...trackerBadgeResetStyle,
    fontFamily: "var(--font-space-mono)",
    fontSize: TRACKER_BADGE.fontSize,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: TRACKER_BADGE.gap,
    color: hasScore ? "var(--primary)" : "var(--fg-subtle)",
    background: hasScore ? "rgba(232,23,63,0.1)" : "transparent",
    border: hasScore ? "1px solid rgba(232,23,63,0.2)" : "1px solid var(--border)",
    ...trackerBadgeBoxStyle,
    height: TRACKER_BADGE.minHeight,
    minWidth: TRACKER_RATING_BADGE_MIN_WIDTH,
    cursor: "pointer",
    textDecoration: "none",
  };
}

type RatingBadgeBaseProps = {
  score: number | null;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

type RatingBadgeSpanProps = RatingBadgeBaseProps &
  HTMLAttributes<HTMLSpanElement> & { as?: "span" };

type RatingBadgeButtonProps = RatingBadgeBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as: "button" };

export type RatingBadgeProps = RatingBadgeSpanProps | RatingBadgeButtonProps;

function RatingBadgeContent({ score }: { score: number | null }) {
  return (
    <>
      <Star size={TRACKER_BADGE.starSize} fill="currentColor" strokeWidth={0} className="shrink-0" aria-hidden />
      <span
        className="inline-flex items-center justify-center shrink-0"
        style={{
          fontSize: TRACKER_BADGE.fontSize,
          lineHeight: 1,
          minWidth: TRACKER_BADGE.scoreMinWidth,
          height: TRACKER_BADGE.fontSize,
          transform: score == null ? "translateY(-0.5px)" : undefined,
        }}
      >
        {score ?? "—"}
      </span>
    </>
  );
}

export function RatingBadge(props: RatingBadgeProps): React.JSX.Element {
  const { score, active, className, style, as = "span", ...rest } = props;
  const isActive = active ?? score != null;
  const badgeStyle = { ...getRatingBadgeStyle(isActive), ...style };

  if (as === "button") {
    const { type = "button", ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button type={type} className={className} style={badgeStyle} {...buttonRest}>
        <RatingBadgeContent score={score} />
      </button>
    );
  }

  const spanRest = rest as HTMLAttributes<HTMLSpanElement>;
  return (
    <span className={className} style={badgeStyle} {...spanRest}>
      <RatingBadgeContent score={score} />
    </span>
  );
}
