"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

const API_MAX = 100000;

interface ProgressCountInputProps {
  value: number;
  /** Known total; when null, allows up to API max. */
  total: number | null;
  ariaLabel: string;
  onCommit: (next: number) => void;
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
  const skipCommitRef = useRef(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

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

  const digitWidth = Math.max(
    String(total != null && total > 0 ? total : value).length,
    draft.length,
    2,
  );

  const style: CSSProperties = {
    width: `calc(${digitWidth}ch + 2px)`,
    minWidth: 16,
    height: fontSize + 4,
    boxSizing: "border-box",
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
    padding: "0 1px 1px",
    margin: 0,
    outline: "none",
    appearance: "none",
    WebkitAppearance: "none",
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
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
      style={style}
    />
  );
}
