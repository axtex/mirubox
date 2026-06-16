"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Check, Plus, Loader2 } from "lucide-react";

interface AnimeCardActionsProps {
  mediaId: number;
  mediaType: string;
  initialStatus?: string | null;
  initialRating?: number | null;
  onStatusChange?: (status: string | null) => void;
  onLikedChange?: (liked: boolean) => void;
}

type ActionKey = "like" | "watched" | "list";

export function AnimeCardActions({
  mediaId,
  mediaType,
  initialStatus = null,
  initialRating = null,
  onStatusChange,
  onLikedChange,
}: AnimeCardActionsProps) {
  const router = useRouter();
  const isManga = mediaType === "MANGA";
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [liked, setLiked] = useState(initialRating !== null && initialRating >= 7);
  const [loading, setLoading] = useState<ActionKey | null>(null);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading("like");
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, score: 8 }),
      });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (res.ok) {
        setLiked(true);
        onLikedChange?.(true);
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleWatched(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading("watched");
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, status: "COMPLETED" }),
      });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (res.ok) {
        setStatus("COMPLETED");
        onStatusChange?.("COMPLETED");
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleAddToList(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading("list");
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeId: mediaId, status: "PLAN_TO_WATCH" }),
      });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (res.ok) {
        setStatus("PLAN_TO_WATCH");
        onStatusChange?.("PLAN_TO_WATCH");
      }
    } finally {
      setLoading(null);
    }
  }

  const isWatched = status === "COMPLETED";
  const isOnList = status !== null;

  return (
    <div className="flex gap-1 mt-1.5">
      <ActionButton
        active={liked}
        loading={loading === "like"}
        onClick={handleLike}
        ariaLabel={liked ? "Liked" : "Like"}
      >
        <Heart className="w-3.5 h-3.5" fill={liked ? "currentColor" : "none"} />
      </ActionButton>

      <ActionButton
        active={isWatched}
        loading={loading === "watched"}
        onClick={handleWatched}
        ariaLabel={isManga ? "Mark as read" : "Mark as watched"}
      >
        <Check className="w-3.5 h-3.5" />
      </ActionButton>

      <ActionButton
        active={isOnList && !isWatched}
        loading={loading === "list"}
        onClick={handleAddToList}
        ariaLabel={isManga ? "Add to read list" : "Add to watchlist"}
      >
        <Plus className="w-3.5 h-3.5" />
      </ActionButton>
    </div>
  );
}

function ActionButton({
  active,
  loading,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean;
  loading: boolean;
  onClick: (e: React.MouseEvent) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={loading}
      className="flex flex-1 items-center justify-center py-2 transition-opacity"
      style={{
        background: "var(--primary)",
        color: "#fff",
        borderRadius: 2,
        opacity: active ? 1 : 0.85,
        cursor: loading ? "wait" : "pointer",
        minHeight: 32,
      }}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : children}
    </button>
  );
}
