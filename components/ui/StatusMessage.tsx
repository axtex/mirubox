type StatusMessageVariant = "default" | "error" | "muted" | "faint";

interface StatusMessageProps {
  children: React.ReactNode;
  variant?: StatusMessageVariant;
  block?: boolean;
  className?: string;
  style?: React.CSSProperties;
  as?: "p" | "span";
}

const variantColor: Record<StatusMessageVariant, string> = {
  default: "var(--fg-subtle)",
  error: "var(--primary)",
  muted: "var(--fg-muted)",
  faint: "var(--fg-faint)",
};

/** Mono status text for empty states, errors, and inline notices. */
export function StatusMessage({
  children,
  variant = "default",
  block,
  className,
  style,
  as: Tag = "p",
}: StatusMessageProps): React.JSX.Element {
  const isError = variant === "error";

  return (
    <Tag
      className={["text-label", block ? "block text-center" : undefined, className].filter(Boolean).join(" ")}
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: isError ? 10 : 11,
        fontWeight: 500,
        letterSpacing: isError ? "0.04em" : "0.06em",
        textTransform: isError ? "none" : "uppercase",
        color: variantColor[variant],
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
