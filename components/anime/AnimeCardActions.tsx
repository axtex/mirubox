"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart } from "lucide-react";
import {
  useTracker,
  STATUS_COLORS,
  STATUS_LABELS,
  isTrackedEntry,
} from "@/lib/tracker-context";
import { LIST_STATUS_BUTTON_WIDTH } from "@/components/tracker/badgeStyles";
import { useAuthModal } from "@/context/AuthModalContext";

interface AnimeCardActionsProps {
  mediaId: number;
  mediaType: string;
  /** "sm" = 24 px mobile row, "md" = 28 px desktop hover bar */
  iconSize?: "sm" | "md";
  /** Fired after a successful tracker add, status change, or remove (null = removed). */
  onTrackerChange?: (status: string | null) => void;
  /** Fired after a successful favourite toggle. */
  onFavouriteChange?: (isFavourite: boolean) => void;
  /** Solid button backgrounds — for tracker poster overlays. */
  opaque?: boolean;
  /** Flat controls matching detail sidebar blocks (TRACK box). */
  sidebar?: boolean;
  /** Fired when the status picker opens or closes (sidebar inline menu). */
  onPickerOpenChange?: (open: boolean) => void;
  /** Tracker list row: full status label, no truncation. */
  listLayout?: boolean;
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
  onTrackerChange,
  onFavouriteChange,
  opaque = false,
  sidebar = false,
  onPickerOpenChange,
  listLayout = false,
}: AnimeCardActionsProps) {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const { isLoggedIn, trackerMap, favouriteIds, addToTracker, updateStatus, removeFromTracker, toggleFavourite } =
    useTracker();

  const entry = trackerMap.get(mediaId) ?? null;
  const isTracked = isTrackedEntry(entry);
  const status = isTracked ? entry!.status : null;
  const isFavourite = favouriteIds.has(mediaId);

  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{
    top: number;
    left: number;
    width: number;
    below: boolean;
  } | null>(null);

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

  useEffect(() => {
    if (sidebar) onPickerOpenChange?.(showPicker);
  }, [showPicker, sidebar, onPickerOpenChange]);

  const handleAddClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn) {
        openAuthModal({
          reason: sidebar ? "track your progress on this title" : "add this to your tracker",
          callbackUrl: pathname,
        });
        return;
      }
      if (sidebar) {
        setShowPicker((open) => !open);
        e.currentTarget.blur();
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
      setPickerPos({
        top: sidebar ? btnRect.bottom : btnRect.top,
        left,
        width,
        below: sidebar,
      });
      setShowPicker((open) => !open);
      e.currentTarget.blur();
    },
    [isLoggedIn, openAuthModal, pathname, iconSize, sidebar]
  );

  const handleStatusSelect = useCallback(
    async (value: string) => {
      setShowPicker(false);
      if (value === "__remove__") {
        // Optimistic list update — don't wait for the network.
        onTrackerChange?.(null);
        await removeFromTracker(mediaId);
        return;
      }
      onTrackerChange?.(value);
      if (!isTracked) {
        await addToTracker(mediaId, mediaType, value);
      } else {
        await updateStatus(mediaId, value);
      }
    },
    [isTracked, mediaId, mediaType, addToTracker, updateStatus, removeFromTracker, onTrackerChange]
  );

  const handleHeart = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoggedIn) {
        openAuthModal({ reason: "save this as a favourite", callbackUrl: pathname });
        return;
      }
      if (loading) return;
      setLoading(true);
      try {
        await toggleFavourite(mediaId, mediaType);
        onFavouriteChange?.(!isFavourite);
      }
      finally { setLoading(false); }
      e.currentTarget.blur();
    },
    [isLoggedIn, loading, mediaId, mediaType, toggleFavourite, openAuthModal, pathname, isFavourite, onFavouriteChange]
  );

  const statusSc = status ? STATUS_COLORS[status] : null;

  const ICON_TRANSITION = "opacity 0.15s ease, fill 0.15s ease, stroke 0.15s ease";

  function addBtnStyle(): React.CSSProperties {
    if (sidebar) {
      if (isTracked && statusSc) {
        return {
          background: "transparent",
          border: `1px solid ${statusSc.border}`,
          color: statusSc.color,
        };
      }
      return {
        background: "transparent",
        border: "1px solid var(--bg-card-high)",
        color: "var(--fg-muted)",
      };
    }
    if (isTracked && statusSc) {
      return opaque
        ? {
            background: "var(--bg-card-high)",
            border: `1px solid ${statusSc.border}`,
            color: statusSc.color,
          }
        : {
            background: statusSc.bg,
            border: `1px solid ${statusSc.border}`,
            color: statusSc.color,
          };
    }
    return opaque
      ? {
          background: "var(--bg-card-high)",
          border: "1px solid var(--border-bright)",
          color: "var(--fg)",
        }
      : {
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#e4e1e6",
        };
  }

  function heartStyle(): React.CSSProperties {
    if (sidebar) {
      if (isFavourite) {
        return {
          background: "var(--primary-dim)",
          border: "1px solid rgba(232,23,63,0.3)",
          color: "var(--primary)",
        };
      }
      return {
        background: "transparent",
        border: "1px solid var(--bg-card-high)",
        color: "var(--fg-muted)",
      };
    }
    if (isFavourite) {
      return opaque
        ? {
            background: "rgba(232,23,63,0.45)",
            border: "1px solid rgba(232,23,63,0.75)",
            color: "#e8173f",
          }
        : {
            background: "rgba(232,23,63,0.15)",
            border: "1px solid rgba(232,23,63,0.4)",
            color: "#e8173f",
          };
    }
    return opaque
      ? {
          background: "var(--bg-card-high)",
          border: "1px solid var(--border-bright)",
          color: "var(--fg-muted)",
        }
      : {
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

  const pickerMenuItems = (
    <>
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
      <button
        type="button"
        role="menuitem"
        disabled={!isTracked}
        onClick={() => { void handleStatusSelect("__remove__"); }}
        style={{
          display: "block",
          width: "100%",
          padding: menuPadding,
          fontFamily: "var(--font-space-mono)",
          fontSize: menuFontSize,
          letterSpacing: "0.05em",
          color: isTracked ? "var(--fg-muted)" : "#3a3a3d",
          background: "transparent",
          border: "none",
          borderTop: "1px solid #2a2a2d",
          cursor: isTracked ? "pointer" : "not-allowed",
          textAlign: "left",
          transition: "background 0.1s, color 0.1s",
          lineHeight: 1.2,
        }}
        onMouseEnter={
          isTracked
            ? (e) => {
                e.currentTarget.style.color = "#e8173f";
                e.currentTarget.style.background = "rgba(232,23,63,0.08)";
              }
            : undefined
        }
        onMouseLeave={
          isTracked
            ? (e) => {
                e.currentTarget.style.color = "var(--fg-muted)";
                e.currentTarget.style.background = "transparent";
              }
            : undefined
        }
      >
        Remove
      </button>
    </>
  );

  const fixedPickerMenu = showPicker && pickerPos && !sidebar ? (
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
        transform: pickerPos.below ? "translateY(4px)" : "translateY(calc(-100% - 4px))",
        zIndex: 9999,
        background: "#1b1b1e",
        border: "1px solid #2a2a2d",
        borderRadius: 2,
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}
    >
      {pickerMenuItems}
    </div>
  ) : null;

  return (
    <>
      {fixedPickerMenu && createPortal(fixedPickerMenu, document.body)}

      <div className={`w-full${sidebar ? " anime-card-actions--sidebar" : ""}`}>
        <div className={`flex gap-1.5 ${sidebar ? "items-start" : "items-center"} ${listLayout ? "" : "w-full"}`}>
        <div className={sidebar ? "flex min-w-0 flex-1 flex-col" : "contents"}>
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
          className={
            sidebar
              ? `detail-sidebar-track-btn${isTracked && statusSc ? " detail-sidebar-track-btn--status" : ""}`
              : undefined
          }
          style={{
            ...ICON_BTN,
            ...addBtnStyle(),
            ...(listLayout
              ? { width: LIST_STATUS_BUTTON_WIDTH }
              : sidebar
                ? { width: "100%" }
                : { flex: 1, minWidth: 0 }),
            display: "inline-flex",
            justifyContent: listLayout ? "space-between" : "center",
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
          <span className={listLayout ? "flex-1 text-center" : "truncate"}>{addLabel}</span>
          <ChevronDown
            size={iconSize === "sm" ? 8 : 9}
            className="shrink-0"
            style={{
              transition: "transform 0.15s ease",
              transform: showPicker ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {sidebar && showPicker && (
          <div
            ref={pickerRef}
            role="menu"
            className="detail-sidebar-track-picker"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {pickerMenuItems}
          </div>
        )}
        </div>

        {/* Heart */}
        <button
          type="button"
          title={heartTitle}
          aria-label={heartTitle}
          onClick={(e) => { void handleHeart(e); }}
          className={
            sidebar
              ? `detail-sidebar-track-btn${isFavourite ? " detail-sidebar-track-btn--favourite" : ""}`
              : undefined
          }
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
      </div>
    </>
  );
}
