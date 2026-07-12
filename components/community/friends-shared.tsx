import Link from "next/link";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { SectionLabel } from "@/components/community/SectionLabel";
import type { FriendsUser } from "@/lib/community-feed";

export function mediaHref(type: string, id: number): string {
  return type === "MANGA" ? `/manga/${id}` : `/anime/${id}`;
}

export function mediaTitle(media: {
  title: string;
  titleEnglish: string | null;
}): string {
  return media.titleEnglish ?? media.title;
}

export function FriendsSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section style={{ minWidth: 0 }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </section>
  );
}

export function CircleAvatar({
  user,
  size = 24,
}: {
  user: FriendsUser;
  size?: number;
}): React.JSX.Element {
  const avatar = (
    <div
      style={{
        display: "inline-flex",
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        width: size,
        height: size,
        lineHeight: 0,
      }}
    >
      <UserAvatar
        userId={user.id}
        username={user.username}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
        size={size}
        borderWidth={0}
      />
    </div>
  );

  if (!user.username) return avatar;

  return (
    <Link href={`/u/${user.username}`} style={{ flexShrink: 0, display: "flex" }}>
      {avatar}
    </Link>
  );
}

/** Small avatar + name inline with action text — matches ALL ACTIVITY format. */
export function InlineUserLabel({
  user,
  trailing,
}: {
  user: FriendsUser;
  trailing?: React.ReactNode;
}): React.JSX.Element {
  const profileHref = user.username ? `/u/${user.username}` : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        minWidth: 0,
        overflow: "hidden",
        fontSize: 11,
        lineHeight: 1.4,
      }}
    >
      <CircleAvatar user={user} size={12} />
      {profileHref ? (
        <Link
          href={profileHref}
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
      {trailing ? (
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 11,
            lineHeight: 1.4,
            color: "#5a5a65",
            minWidth: 0,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export function CoverThumb({
  src,
  href,
  width,
  height,
}: {
  src: string | null;
  href: string;
  width: number;
  height: number;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      style={{
        width,
        height,
        borderRadius: 2,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-elevated)",
        display: "block",
      }}
    >
      {src ? (
        <ImageWithFallback src={src} alt="" fill sizes={`${width}px`} className="object-cover" />
      ) : null}
    </Link>
  );
}

export function ReviewStars({ score }: { score: number }): React.JSX.Element {
  const filled = Math.round(score);
  return (
    <span
      style={{ display: "inline-flex", gap: 1 }}
      aria-label={`${score} out of 10`}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: 10,
            color: i < filled ? "var(--primary)" : "var(--bg-card-high)",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
