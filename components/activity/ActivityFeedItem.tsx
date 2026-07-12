"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import type { ActivityItem } from "@/lib/profile-types";
import type { FeedUser } from "@/lib/community-feed";
import {
  actionIcon,
  actionText,
  socialActionText,
  subText,
  type ActionText,
} from "@/lib/activity-display";
import { timeAgo } from "@/lib/time-ago";

export interface ActivityFeedItemProps {
  item: ActivityItem;
  variant?: "profile" | "social";
  user?: FeedUser;
  isLast?: boolean;
}

function renderActionText(text: ActionText): React.ReactNode {
  return (
    <>
      {text.prefix}
      {text.highlight ? (
        <span style={{ color: "var(--fg)", fontWeight: 500 }}>
          {text.highlight}
        </span>
      ) : null}
      {text.suffix ?? ""}
    </>
  );
}

function SocialUserPrefix({ user }: { user: FeedUser }): React.JSX.Element {
  const profileHref = user.username ? `/u/${user.username}` : null;

  const avatarWrap = (
    <span
      style={{
        display: "block",
        width: 12,
        height: 12,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <UserAvatar
        userId={user.id}
        username={user.username}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
        size={12}
        borderWidth={0}
      />
    </span>
  );

  return (
    <>
      {profileHref ? (
        <Link
          href={profileHref}
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", flexShrink: 0 }}
        >
          {avatarWrap}
        </Link>
      ) : (
        avatarWrap
      )}
      {profileHref ? (
        <Link
          href={profileHref}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            lineHeight: 1.4,
            color: "var(--primary)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {user.displayName}
        </Link>
      ) : (
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            lineHeight: 1.4,
            color: "var(--primary)",
            flexShrink: 0,
          }}
        >
          {user.displayName}
        </span>
      )}
    </>
  );
}

export function ActivityFeedItem({
  item,
  variant = "profile",
  user,
  isLast = false,
}: ActivityFeedItemProps): React.JSX.Element {
  const router = useRouter();
  const style = variant === "profile" ? actionIcon(item.action) : null;
  const text =
    variant === "social" ? socialActionText(item) : actionText(item);
  const sub = variant === "social" ? null : subText(item);
  const showPoster = !!item.media?.coverImage;
  const clickable = variant === "social" && !!item.media;

  function handleClick(): void {
    if (!item.media) return;
    const path =
      item.media.type === "MANGA"
        ? `/manga/${item.media.id}`
        : `/anime/${item.media.id}`;
    router.push(path);
  }

  const actionLine =
    variant === "social" && user ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          minWidth: 0,
          overflow: "hidden",
          fontSize: 11,
          color: "var(--fg-muted)",
          lineHeight: 1.4,
        }}
      >
        <SocialUserPrefix user={user} />
        <span
          style={{
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {renderActionText(text)}
        </span>
      </div>
    ) : (
      <p
        style={{
          fontSize: 11,
          color: "var(--fg-muted)",
          lineHeight: 1.4,
          margin: 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {renderActionText(text)}
      </p>
    );

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: isLast ? "none" : "1px solid #1a1a1d",
        cursor: clickable ? "pointer" : "default",
      }}
    >
      {style ? (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            flexShrink: 0,
            background: style.bg,
            border: `1px solid ${style.border}`,
          }}
        >
          {style.icon}
        </div>
      ) : null}

      <div
        style={{
          width: 26,
          height: 36,
          borderRadius: 2,
          flexShrink: 0,
          position: "relative",
          overflow: "hidden",
          background: showPoster ? "var(--bg-elevated)" : "transparent",
        }}
      >
        {showPoster && item.media?.coverImage ? (
          <Image
            src={item.media.coverImage}
            alt=""
            fill
            sizes="26px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {actionLine}
        {sub ? (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg-faint)",
              margin: "1px 0 0",
            }}
          >
            {sub}
          </p>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 2,
          flexShrink: 0,
        }}
      >
        {item.amount > 0 ? (
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--primary)",
              fontWeight: 600,
            }}
          >
            +{item.amount}
          </span>
        ) : null}
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "var(--fg-faint)",
          }}
        >
          {timeAgo(item.createdAt)}
        </span>
      </div>
    </div>
  );
}
