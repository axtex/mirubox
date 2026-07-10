import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

const btnBase: CSSProperties = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  color: "var(--fg-muted)",
  border: "1px solid var(--bg-card-high)",
  background: "transparent",
  borderRadius: 2,
  padding: "5px 10px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  letterSpacing: "0.04em",
};

const iconBtnStyle: CSSProperties = {
  ...btnBase,
  width: 28,
  height: 28,
  padding: 0,
  justifyContent: "center",
  flexShrink: 0,
};

interface IconButtonBaseProps {
  children: ReactNode;
  "aria-label": string;
  style?: CSSProperties;
  className?: string;
}

interface IconButtonLinkProps extends IconButtonBaseProps {
  href: string;
  onClick?: never;
  type?: never;
}

interface IconButtonActionProps extends IconButtonBaseProps {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
}

export type IconButtonProps = IconButtonLinkProps | IconButtonActionProps;

/** Outlined 28×28 icon control — same as profile header edit/share. */
export function IconButton(props: IconButtonProps): React.JSX.Element {
  const { children, style, className, "aria-label": ariaLabel } = props;
  const merged = style ? { ...iconBtnStyle, ...style } : iconBtnStyle;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} aria-label={ariaLabel} className={className} style={merged}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      aria-label={ariaLabel}
      className={className}
      style={merged}
      onClick={props.onClick}
    >
      {children}
    </button>
  );
}

export { btnBase as outlineBtnBase };
