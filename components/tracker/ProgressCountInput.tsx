"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

const API_MAX = 100000;

interface ProgressCountInputProps {
  value: number;
  /** Known total; when null, allows up to API max. */
  total: number | null;
  ariaLabel: string;
  onCommit: (next: number) => void;
  /** Must match the surrounding total label size. */
  fontSize?: number;
  color?: string;
}

function clampProgress(n: number, total: number | null): number {
  const max = total != null && total > 0 ? total : API_MAX;
  return Math.max(0, Math.min(max, Math.floor(n)));
}

export function ProgressCountInput({
  value,
  total,
  ariaLabel,
  onCommit,
  fontSize = 10,
  color = "var(--fg-muted)",
}: ProgressCountInputProps): React.JSX.Element {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const [textWidth, setTextWidth] = useState(0);
  const skipCommitRef = useRef(false);
  const sizerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  // Size to the visible digits only (1 < 2 < 3); empty draft still reserves one digit.
  const sizerText = draft.length > 0 ? draft : "0";

  useLayoutEffect(() => {
    function measure(): void {
      if (!sizerRef.current) return;
      setTextWidth(Math.ceil(sizerRef.current.offsetWidth));
    }
    measure();
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [sizerText, fontSize]);

  function commit(): void {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clampProgress(parsed, total);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      skipCommitRef.current = true;
      setDraft(String(value));
      (e.target as HTMLInputElement).blur();
    }
  }

  // Tight pad: input padding (2×2) + small WebKit inset — enough not to clip, not so wide it crowds "/ total".
  const pad = 6;
  const width = textWidth > 0 ? textWidth + pad : fontSize + pad;

  const shellStyle: CSSProperties = {
    ["--progress-fs" as string]: `${fontSize}px`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
    verticalAlign: "middle",
    width,
    height: fontSize + 4,
    fontFamily: "var(--font-space-mono)",
    fontSize,
    lineHeight: 1,
  };

  const inputStyle: CSSProperties = {
    boxSizing: "border-box",
    display: "block",
    width: "100%",
    height: "100%",
    fontFamily: "var(--font-space-mono)",
    fontSize,
    fontWeight: 500,
    lineHeight: 1,
    color: focused ? "var(--fg)" : color,
    textAlign: "center",
    background: "transparent",
    border: "none",
    borderBottom: focused
      ? "1px solid var(--fg-muted)"
      : "1px solid var(--fg-subtle)",
    borderRadius: 0,
    padding: "0 2px",
    margin: 0,
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
  };

  const sizerStyle: CSSProperties = {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    whiteSpace: "pre",
    fontFamily: "var(--font-space-mono)",
    fontSize,
    fontWeight: 500,
    lineHeight: 1,
  };

  return (
    <span className="progress-count-shell" style={shellStyle}>
      <span ref={sizerRef} aria-hidden style={sizerStyle}>
        {sizerText}
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        className="progress-count-input"
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "");
          setDraft(next);
        }}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => {
          setFocused(false);
          if (skipCommitRef.current) {
            skipCommitRef.current = false;
            setDraft(String(value));
            return;
          }
          commit();
        }}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />
    </span>
  );
}
