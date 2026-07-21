import type { LucideIcon } from "lucide-react";

interface IconCircleProps {
  Icon: LucideIcon;
  bg: string;
  border: string;
  color?: string;
  size?: number;
  iconSize?: number;
}

/** Squared chip (borderRadius 2, like profile badges) with a centered Lucide icon. */
export function IconCircle({
  Icon,
  bg,
  border,
  color = "var(--fg)",
  size = 28,
  iconSize = 13,
}: IconCircleProps): React.JSX.Element {
  return (
    <span
      className="inline-flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 2,
        background: bg,
        border: `1px solid ${border}`,
        color,
        lineHeight: 0,
      }}
      aria-hidden
    >
      <Icon
        size={iconSize}
        strokeWidth={1.75}
        style={{ display: "block", flexShrink: 0 }}
      />
    </span>
  );
}
