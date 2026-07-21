"use client";

import { useEffect, useRef, useState } from "react";
import type { Toast as ToastData } from "@/context/ToastContext";
import { getNotifVisual, notifBodyText } from "@/lib/notification-visuals";
import { IconCircle } from "@/components/ui/IconCircle";

const AUTO_DISMISS_MS = 4000;
const EXIT_DURATION_MS = 150;
const SWIPE_TRACK_THRESHOLD = 10;
const SWIPE_DISMISS_THRESHOLD = 80;

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const [dismissing, setDismissing] = useState<"auto" | "manual" | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const tracking = useRef(false);

  const finish = (mode: "auto" | "manual") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDismissing(mode);
    setTimeout(() => onDismiss(toast.id), EXIT_DURATION_MS);
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => finish("auto"), AUTO_DISMISS_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    tracking.current = false;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    if (!tracking.current) {
      if (Math.abs(dx) < SWIPE_TRACK_THRESHOLD) return;
      tracking.current = true;
    }
    if (dx > 0) setSwipeX(dx);
  }

  function handleTouchEnd() {
    if (swipeX > SWIPE_DISMISS_THRESHOLD) {
      finish("manual");
    } else {
      setSwipeX(0);
    }
    touchStartX.current = null;
    tracking.current = false;
  }

  const visual = getNotifVisual(toast.type);
  const body = notifBodyText(toast.type, toast.body);

  return (
    <div
      className="toast-item"
      data-dismissing={dismissing ?? undefined}
      style={swipeX > 0 ? { transform: `translateX(${swipeX}px)` } : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="status"
    >
      <IconCircle
        Icon={visual.Icon}
        bg={visual.bg}
        border={visual.border}
        color="#e4e1e6"
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#e4e1e6",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {toast.title}
        </p>
        {body && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "#9e9ea8",
              marginTop: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {body}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => finish("manual")}
        aria-label="Dismiss"
        className="toast-close"
      >
        ×
      </button>

      {dismissing === null && <div className="toast-progress" />}
    </div>
  );
}
