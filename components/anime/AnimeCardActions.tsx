"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart } from "lucide-react";
import {
  useArchive,
  STATUS_COLORS,
  STATUS_LABELS,
  isTrackedEntry,
} from "@/lib/archive-context";

interface AnimeCardActionsProps {
  mediaId: number;
  mediaType: string;
  /** "sm" = 24 px mobile row, "md" = 28 px desktop hover bar */
  iconSize?: "sm" | "md";
}

const STATUS_OPTIONS = [
  { value: "IN_PROGRESS", label: STATUS_LABELS.IN_PROGRESS },
  { value: "COMPLETED", label: STATUS_LABELS.COMPLETED },
  { value: "PLANNED", label: STATUS_LABELS.PLANNED },
  { value: "DROPPED", label: STATUS_LABELS.DROPPED },
  { value: "ON_HOLD", label: STATUS_LABELS.ON_HOLD },
] as const;

export function AnimeCardActions({
  mediaId,
  mediaType,
  iconSize = "md",
}: AnimeCardActionsProps) {
  const router = useRouter();
  const { isLoggedIn, archiveMap, addToArchive, updateStatus, removeFromArchive, toggleFavourite } =
    useArchive();

  const entry = archiveMap.get(mediaId) ?? null;
  const isTracked = isTrackedEntry(entry);
  const status = isTracked ? entry!.status : null;
  const isFavourite = entry?.favourite ?? false;

  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const addBtnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const dim = iconSize === "sm" ? 24 : 28;
  const iconPx = iconSize === "sm" ? 12 : 14;
  const labelSize = iconSize === "sm" ? 8 : 9;

  useEffect(() => {
    if (!showPicker) return;
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!pickerRef.current?.contains(target) && !addBtnRef.current?.contains(target)) {
        setShowPicker(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowPicker(false);
    }
    // Defer so the opening click doesn't immediately close the menu
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onMouseDown);
    }, 0);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showPicker]);

  const handleAddClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn) {
        router.push("/auth/signin");
        return;
      }
      if (!addBtnRef.current) return;
      const btnRect = addBtnRef.current.getBoundingClientRect();
      const cardEl = addBtnRef.current.closest(".anime-card");
      const cardRect = cardEl?.getBoundingClientRect();
      const inset = iconSize === "sm" ? 4 : 7;
      const width = cardRect
        ? Math.max(cardRect.width - inset * 2, btnRect.width)
        : btnRect.width;
      const left = cardRect ? cardRect.left + inset : btnRect.left;
      setPickerPos({ top: btnRect.top, left, width });
      setShowPicker((open) => !open);
      e.currentTarget.blur();
    },
    [isLoggedIn, router, iconSize]
  );

  const handleStatusSelect = useCallback(
    async (value: string) => {
      setShowPicker(false);
      if (value === "__remove__") {
        await removeFromArchive(mediaId);
        return;
      }
      if (!isTracked) {
        await addToArchive(mediaId, mediaType, value);
      } else {
        await updateStatus(mediaId, value);
      }
    },
    [isTracked, mediaId, mediaType, addToArchive, updateStatus, removeFromArchive]
  );

  const handleHeart = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn) { router.push("/auth/signin"); return; }
      if (loading) return;
      setLoading(true);
      try { await toggleFavourite(mediaId, mediaType); }
      finally { setLoading(false); }
      e.currentTarget.blur();
    },
    [isLoggedIn, loading, mediaId, mediaType, toggleFavourite, router]
  );

  const statusSc = status ? STATUS_COLORS[status] : null;

  const ICON_TRANSITION = "opacity 0.15s ease, fill 0.15s ease, stroke 0.15s ease";

  function addBtnStyle(): React.CSSProperties {
    if (isTracked && statusSc) {
      return {
        background: statusSc.bg,
        border: `1px solid ${statusSc.border}`,
        color: statusSc.color,
      };
    }
    return {
      background: "rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.2)",
      color: "#e4e1e6",
    };
  }

  function heartStyle(): React.CSSProperties {
    if (isFavourite) {
      return {
        background: "rgba(232,23,63,0.15)",
        border: "1px solid rgba(232,23,63,0.4)",
        color: "#e8173f",
      };
    }
    return {
      background: "rgba(0,0,0,0.4)",
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#9e9ea8",
    };
  }

  const ICON_BTN: React.CSSProperties = {
    width: dim,
    height: dim,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s",
    flexShrink: 0,
  };

  const addLabel = isTracked && status ? (STATUS_LABELS[status] ?? status) : "+ Add";
  const addAriaLabel = isTracked && status
    ? `Status: ${STATUS_LABELS[status] ?? status}. Change status`
    : "Add to tracker";
  const heartTitle = isFavourite ? "Unfavourite" : "Favourite";
  const menuFontSize = iconSize === "sm" ? 8 : 9;
  const menuPadding = iconSize === "sm" ? "4px 6px" : "5px 8px";

  const pickerMenu = showPicker && pickerPos ? (
    <div
      ref={pickerRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      role="menu"
      style={{
        position: "fixed",
        top: pickerPos.top,
        left: pickerPos.left,
        width: pickerPos.width,
        maxWidth: pickerPos.width,
        boxSizing: "border-box",
        transform: "translateY(calc(-100% - 4px))",
        zIndex: 9999,
        background: "#1b1b1e",
        border: "1px solid #2a2a2d",
        borderRadius: 2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}
    >
      {STATUS_OPTIONS.map((opt) => {
        const isActive = status === opt.value;
        const optSc = STATUS_COLORS[opt.value];
        return (
          <button
            key={opt.value}
            type="button"
            role="menuitem"
            onClick={() => { void handleStatusSelect(opt.value); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: "100%",
              padding: menuPadding,
              fontFamily: "var(--font-space-mono)",
              fontSize: menuFontSize,
              letterSpacing: "0.05em",
              color: isActive ? optSc?.color : "var(--fg-muted)",
              background: isActive ? optSc?.bg : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.1s, color 0.1s",
              textAlign: "left",
              lineHeight: 1.2,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = optSc?.bg ?? "rgba(255,255,255,0.05)";
              el.style.color = optSc?.color ?? "var(--fg)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = isActive ? (optSc?.bg ?? "transparent") : "transparent";
              el.style.color = isActive ? (optSc?.color ?? "var(--fg-muted)") : "var(--fg-muted)";
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: optSc?.color ?? "var(--fg-muted)",
                flexShrink: 0,
              }}
            />
            {opt.label}
          </button>
        );
      })}
      {isTracked && (
        <>
          <div style={{ height: 1, background: "#2a2a2d", margin: "2px 0" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => { void handleStatusSelect("__remove__"); }}
            style={{
              display: "block",
              width: "100%",
              padding: menuPadding,
              fontFamily: "var(--font-space-mono)",
              fontSize: menuFontSize,
              letterSpacing: "0.05em",
              color: "var(--fg-muted)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s, color 0.1s",
              lineHeight: 1.2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e8173f";
              e.currentTarget.style.background = "rgba(232,23,63,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--fg-muted)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Remove
          </button>
        </>
      )}
    </div>
  ) : null;

  return (
    <>
      {pickerMenu && createPortal(pickerMenu, document.body)}

      <div className="flex gap-1.5 items-center w-full">
        {/* Status dropdown */}
        <button
          ref={addBtnRef}
          type="button"
          title={addAriaLabel}
          aria-label={addAriaLabel}
          aria-expanded={showPicker}
          aria-haspopup="menu"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleAddClick}
          style={{
            ...ICON_BTN,
            ...addBtnStyle(),
            flex: 1,
            minWidth: 0,
            width: "auto",
            display: "inline-flex",
            justifyContent: "center",
            padding: iconSize === "sm" ? "0 6px" : "0 8px",
            gap: 4,
            fontFamily: "var(--font-space-mono)",
            fontSize: labelSize,
            fontWeight: 500,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {isTracked && statusSc && (
            <span
              className="rounded-full shrink-0"
              style={{ width: 6, height: 6, background: statusSc.color }}
            />
          )}
          <span className="truncate">{addLabel}</span>
          <ChevronDown
            size={iconSize === "sm" ? 8 : 9}
            className="shrink-0"
            style={{
              transition: "transform 0.15s ease",
              transform: showPicker ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {/* Heart */}
        <button
          type="button"
          title={heartTitle}
          aria-label={heartTitle}
          onClick={(e) => { void handleHeart(e); }}
          style={{ ...ICON_BTN, ...heartStyle() }}
        >
          <Heart
            size={iconPx}
            fill={isFavourite ? "#e8173f" : "none"}
            stroke={isFavourite ? "#e8173f" : "currentColor"}
            style={{
              opacity: loading ? 0.7 : 1,
              transition: ICON_TRANSITION,
            }}
          />
        </button>
      </div>
    </>
  );
}
