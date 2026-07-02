"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  active?: boolean;
  /** "control" matches tracker header buttons; "filter" matches search filter row */
  variant?: "filter" | "control";
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  active = false,
  variant = "filter",
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const triggerLabel = selected?.label ?? placeholder ?? options[0]?.label ?? "SELECT";

  const isControl = variant === "control";

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectOption(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          paddingLeft: 10,
          paddingRight: 8,
          minWidth: isControl ? 148 : 120,
          background: active ? "var(--primary)" : isControl ? "var(--bg-card)" : "var(--bg-elevated)",
          color: active ? "#fff" : isControl ? "var(--fg-subtle)" : "var(--fg-muted)",
          border: `1px solid ${active ? "var(--primary)" : isControl ? "var(--border)" : "var(--bg-card-high)"}`,
          borderRadius: 2,
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          letterSpacing: "0.06em",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
        }}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          size={10}
          className="shrink-0"
          style={{
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "none",
            color: active ? "#fff" : "var(--fg-subtle)",
          }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: "100%",
            zIndex: 50,
            background: "var(--bg-card-high)",
            border: "1px solid var(--border-bright)",
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          {placeholder && (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => selectOption("")}
              style={menuItemStyle(!value)}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = !value ? "var(--primary-dim)" : "transparent"; }}
            >
              {placeholder}
            </button>
          )}
          {options.map((o) => {
            const selectedOption = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={selectedOption}
                onClick={() => selectOption(o.value)}
                style={menuItemStyle(selectedOption)}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = selectedOption ? "var(--primary-dim)" : "transparent"; }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function menuItemStyle(selected: boolean): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "8px 10px",
    fontFamily: "var(--font-space-mono)",
    fontSize: 10,
    letterSpacing: "0.05em",
    color: selected ? "var(--primary)" : "var(--fg-muted)",
    background: selected ? "var(--primary-dim)" : "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    lineHeight: 1.2,
    transition: "background 0.1s ease, color 0.1s ease",
  };
}
