"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { FollowButton } from "@/components/profile/FollowButton";
import { getRankProgress } from "@/lib/ranks";
import type { FollowListUser } from "@/lib/follow-users";

export interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: "followers" | "following";
}

function FollowListRow({
  user,
  viewerId,
  callbackPath,
}: {
  user: FollowListUser;
  viewerId: string | null;
  callbackPath: string;
}): React.JSX.Element {
  const rank = getRankProgress(user.totalXP);
  const profileHref = user.username ? `/u/${user.username}` : null;
  const isOwnEntry = viewerId === user.id;

  const rankBadge = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        flexShrink: 0,
        fontFamily: "var(--font-space-mono)",
        fontSize: 9,
        fontWeight: 600,
        color: "var(--primary)",
        background: "var(--badge-earned-bg)",
        border: "1.5px solid var(--badge-earned-border)",
        borderRadius: 2,
        padding: "1px 4px",
        letterSpacing: "0.04em",
      }}
    >
      {rank.name}
    </span>
  );

  const nameRow = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
      }}
    >
      {profileHref ? (
        <Link
          href={profileHref}
          style={{
            fontSize: 12,
            color: "#e4e1e6",
            textDecoration: "none",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {user.displayName}
        </Link>
      ) : (
        <span
          style={{
            fontSize: 12,
            color: "#e4e1e6",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {user.displayName}
        </span>
      )}
      {rankBadge}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "10px 14px",
        borderBottom: "1px solid #1a1a1d",
      }}
    >
      {profileHref ? (
        <Link href={profileHref} style={{ flexShrink: 0 }}>
          <UserAvatar
            userId={user.id}
            username={user.username}
            displayName={user.displayName}
            avatarUrl={user.avatarUrl}
            size={32}
          />
        </Link>
      ) : (
        <UserAvatar
          userId={user.id}
          username={user.username}
          displayName={user.displayName}
          avatarUrl={user.avatarUrl}
          size={32}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {user.username ? (
          profileHref ? (
            <Link
              href={profileHref}
              style={{
                display: "block",
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--fg-subtle)",
                textDecoration: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 2,
              }}
            >
              @{user.username}
            </Link>
          ) : (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--fg-subtle)",
                margin: "0 0 2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              @{user.username}
            </p>
          )
        ) : null}
        {nameRow}
      </div>

      {viewerId && user.username && !isOwnEntry ? (
        <FollowButton
          username={user.username}
          initialIsFollowing={user.isFollowing}
          callbackPath={callbackPath}
        />
      ) : null}
    </div>
  );
}

export function FollowListModal({
  isOpen,
  onClose,
  username,
  type,
}: FollowListModalProps): React.JSX.Element | null {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<FollowListUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const title = type === "followers" ? "FOLLOWERS" : "FOLLOWING";
  const emptyMessage =
    type === "followers" ? "No followers yet" : "Not following anyone yet";
  const callbackPath = `/u/${username}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeydown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    void fetch(`/api/users/${username}/${type}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load");
        const data = (await res.json()) as { users: FollowListUser[] };
        if (!cancelled) setUsers(data.users);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, username, type]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
          width: "calc(100% - 32px)",
          maxWidth: 420,
          maxHeight: "min(70vh, 520px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#131316",
            borderBottom: "1px solid #1f1f22",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--fg-muted)",
              letterSpacing: "0.06em",
            }}
          >
            {title}
            {!loading && !error ? ` · ${users.length}` : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="review-modal-close"
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                padding: "20px 14px",
                margin: 0,
              }}
            >
              Loading...
            </p>
          ) : error ? (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                padding: "20px 14px",
                margin: 0,
              }}
            >
              Failed to load list.
            </p>
          ) : users.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--fg-muted)",
                padding: "20px 14px",
                margin: 0,
              }}
            >
              {emptyMessage}
            </p>
          ) : (
            users.map((user) => (
              <FollowListRow
                key={user.id}
                user={user}
                viewerId={session?.user?.id ?? null}
                callbackPath={callbackPath}
              />
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
