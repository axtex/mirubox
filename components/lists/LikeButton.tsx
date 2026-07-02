"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

interface Props {
  slug: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}

export function LikeButton({ slug, initialLiked, initialCount, isLoggedIn }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/auth/signin");
      return;
    }
    if (pending) return;
    setPending(true);
    setLiked((p) => !p);
    setCount((p) => (liked ? p - 1 : p + 1));
    try {
      const res = await fetch(`/api/lists/${slug}/like`, { method: "POST" });
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked((p) => !p);
      setCount((p) => (liked ? p + 1 : p - 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 10,
        letterSpacing: "0.06em",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        border: liked ? "1px solid #e8173f" : "1px solid #2a2a2d",
        borderRadius: 2,
        background: liked ? "rgba(232,23,63,0.08)" : "transparent",
        color: liked ? "#e8173f" : "var(--fg-muted)",
        cursor: pending ? "default" : "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <Heart
        size={10}
        fill={liked ? "#e8173f" : "none"}
        stroke={liked ? "#e8173f" : "currentColor"}
        aria-hidden
      />
      {count}
    </button>
  );
}
