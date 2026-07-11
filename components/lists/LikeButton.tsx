"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuthModal } from "@/context/AuthModalContext";
import { useToast } from "@/context/ToastContext";

interface Props {
  slug: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  /** When true, show count only — no toggle (e.g. own list). */
  canLike?: boolean;
}

export function LikeButton({
  slug,
  initialLiked,
  initialCount,
  isLoggedIn,
  canLike = true,
}: Props) {
  const pathname = usePathname();
  const { openAuthModal } = useAuthModal();
  const { showToast } = useToast();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!canLike) return;
    if (!isLoggedIn) {
      openAuthModal({ reason: "like and save lists", callbackUrl: pathname });
      return;
    }
    if (pending) return;
    setPending(true);
    setLiked((p) => !p);
    setCount((p) => (liked ? p - 1 : p + 1));
    try {
      const res = await fetch(`/api/lists/${slug}/like`, { method: "POST" });
      if (!res.ok) {
        setLiked((p) => !p);
        setCount((p) => (liked ? p + 1 : p - 1));
        showToast({ type: "ERROR", title: "Something went wrong", body: "Please try again" });
        return;
      }
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked((p) => !p);
      setCount((p) => (liked ? p + 1 : p - 1));
      showToast({ type: "ERROR", title: "Something went wrong", body: "Please try again" });
    } finally {
      setPending(false);
    }
  }

  const heart = (
    <Heart
      size={10}
      fill={liked ? "#e8173f" : "none"}
      stroke={liked ? "#e8173f" : "currentColor"}
      aria-hidden
    />
  );

  if (!canLike) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-muted)",
        }}
      >
        {heart}
        {count}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={liked ? "Unlike list" : "Like list"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: 0,
        border: "none",
        background: "transparent",
        fontFamily: "var(--font-space-mono)",
        fontSize: 10,
        color: liked ? "#e8173f" : "var(--fg-muted)",
        cursor: pending ? "default" : "pointer",
        transition: "color 0.15s ease",
      }}
    >
      {heart}
      {count}
    </button>
  );
}
