interface ReviewIconProps {
  className?: string;
  size?: number;
  "aria-label"?: string;
}

/** Letterboxd-style review glyph: three left-aligned text lines. */
export function ReviewIcon({
  className,
  size = 12,
  "aria-label": ariaLabel,
}: ReviewIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
    >
      <rect x="1" y="2" width="10" height="1.25" rx="0.5" />
      <rect x="1" y="5.375" width="7" height="1.25" rx="0.5" />
      <rect x="1" y="8.75" width="8.5" height="1.25" rx="0.5" />
    </svg>
  );
}
