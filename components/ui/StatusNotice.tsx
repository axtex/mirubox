import { DotPulse } from "./DotPulse";

interface StatusNoticeProps {
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const noticeStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--fg-subtle)",
};

/** Inline loading/searching row — mono uppercase, optional dot pulse. */
export function StatusNotice({ children, pulse, className, style }: StatusNoticeProps): React.JSX.Element {
  return (
    <div
      className={["text-label inline-flex items-center gap-1.5", className].filter(Boolean).join(" ")}
      style={{ ...noticeStyle, ...style }}
    >
      {pulse ? <DotPulse /> : null}
      {children}
    </div>
  );
}
