export const TRACKER_BADGE = {
  padding: "4px 6px",
  borderRadius: 2,
  fontSize: 10,
  starSize: 8,
  iconSize: 10,
  dotSize: 9,
  chevronSize: 9,
  /** Fits "10" in space mono at 10px */
  scoreMinWidth: 16,
  /** Content row + vertical padding + border */
  minHeight: 20,
  gap: 3,
} as const;

/** Star + gap + score slot + horizontal padding + border */
export const TRACKER_RATING_BADGE_MIN_WIDTH =
  12 + TRACKER_BADGE.starSize + TRACKER_BADGE.gap + TRACKER_BADGE.scoreMinWidth + 2;

export const trackerBadgeBoxStyle = {
  padding: TRACKER_BADGE.padding,
  borderRadius: TRACKER_BADGE.borderRadius,
  lineHeight: 1,
  minHeight: TRACKER_BADGE.minHeight,
  boxSizing: "border-box" as const,
} satisfies React.CSSProperties;

/** Keeps row alignment when review badge is inactive (no visible box). */
export const trackerBadgeInactiveReviewStyle = {
  ...trackerBadgeBoxStyle,
  border: "1px solid transparent",
} satisfies React.CSSProperties;

export const trackerBadgeResetStyle = {
  margin: 0,
  font: "inherit",
  appearance: "none" as const,
  WebkitAppearance: "none" as const,
} satisfies React.CSSProperties;

/** Dot + chevron status dropdown trigger aligned to tracker row badges. */
export const trackerStatusDropdownTriggerStyle = {
  ...trackerBadgeResetStyle,
  ...trackerBadgeBoxStyle,
  height: TRACKER_BADGE.minHeight,
  padding: "4px 5px",
  gap: TRACKER_BADGE.gap,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "1px solid var(--border)",
} satisfies React.CSSProperties;
