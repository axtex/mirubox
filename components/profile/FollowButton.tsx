"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { outlineBtnBase } from "@/components/ui/IconButton";
import { useToast } from "@/context/ToastContext";

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  callbackPath?: string;
  onFollowChange?: (following: boolean) => void;
}

export function FollowButton({
  username,
  initialIsFollowing,
  callbackPath,
  onFollowChange,
}: FollowButtonProps): React.JSX.Element {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const signInPath =
    callbackPath ?? (username ? `/u/${username}` : "/profile");

  async function handleClick(): Promise<void> {
    if (!session?.user?.id) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(signInPath)}`;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      if (res.status === 429) {
        showToast({
          type: "ERROR",
          title: "Too many requests",
          body: "Please slow down and try again.",
        });
        return;
      }

      if (!res.ok) {
        showToast({
          type: "ERROR",
          title: "Something went wrong",
          body: "Please try again.",
        });
        return;
      }

      const nextFollowing = !isFollowing;
      setIsFollowing(nextFollowing);
      onFollowChange?.(nextFollowing);
    } catch {
      showToast({
        type: "ERROR",
        title: "Something went wrong",
        body: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const showUnfollow = isFollowing && hovered && !loading;

  let label = "FOLLOW";
  if (loading) label = "...";
  else if (showUnfollow) label = "UNFOLLOW";
  else if (isFollowing) label = "FOLLOWING";

  const followStyle = {
    ...outlineBtnBase,
    color: "#fff",
    background: "#e8173f",
    border: "none",
    padding: "5px 12px",
    fontWeight: 600,
    letterSpacing: "0.06em",
  };

  const followingStyle = {
    ...outlineBtnBase,
    color: showUnfollow ? "#e8173f" : "var(--fg-muted)",
    background: "transparent",
    border: showUnfollow ? "1px solid #e8173f" : "1px solid var(--bg-card-high)",
    padding: "5px 12px",
    fontWeight: 600,
    letterSpacing: "0.06em",
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={isFollowing || showUnfollow ? followingStyle : followStyle}
    >
      {label}
    </button>
  );
}
