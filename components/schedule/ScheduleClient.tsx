"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import type { UpcomingEpisode, RecentRelease } from "@/lib/schedule-data";

type ViewTab = "upcoming" | "recent";

interface ScheduleClientProps {
  upcoming: UpcomingEpisode[];
  recent: RecentRelease[];
}

const PILL_BASE = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 10,
  letterSpacing: "0.06em",
  padding: "5px 14px",
  borderRadius: 2,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
  border: "none",
} as const;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function dayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return "TODAY";
  if (date.toDateString() === tomorrow.toDateString()) return "TOMORROW";
  return date
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

function relativeGroup(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";
  if (diffDays < 7) return `${diffDays} DAYS AGO`;
  return "OLDER";
}

function daysAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function formatCountdown(
  airingAt: Date,
  now: number,
): { text: string; color: string } {
  const ms = airingAt.getTime() - now;
  if (ms <= 0) return { text: "now", color: "var(--primary)" };

  const totalMins = Math.floor(ms / 60000);
  if (totalMins < 60) {
    return { text: `${Math.max(1, totalMins)}m`, color: "var(--primary)" };
  }
  if (totalMins < 24 * 60) {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return { text: `${h}h ${m}m`, color: "var(--fg-muted)" };
  }

  const nowDate = new Date(now);
  const tomorrow = new Date(nowDate);
  tomorrow.setDate(nowDate.getDate() + 1);
  const timeStr = airingAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (airingAt.toDateString() === tomorrow.toDateString()) {
    return { text: timeStr, color: "var(--fg-muted)" };
  }

  const day = airingAt.toLocaleDateString("en-US", { weekday: "short" });
  return { text: `${day} ${timeStr}`, color: "var(--fg-muted)" };
}

function GroupLabel({
  label,
  isFirst,
}: {
  label: string;
  isFirst: boolean;
}): React.JSX.Element {
  return (
    <p
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 9,
        color: "var(--fg-subtle)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        paddingTop: isFirst ? 0 : 16,
        paddingBottom: 6,
      }}
    >
      {label}
    </p>
  );
}

function SparseNote(): React.JSX.Element {
  return (
    <p
      style={{
        fontFamily: "var(--font-space-mono)",
        fontSize: 9,
        color: "var(--fg-subtle)",
        textAlign: "center",
        padding: "8px 0 4px",
      }}
    >
      Schedule data grows as you track more titles. Episode times update daily.
    </p>
  );
}

function EmptyState({
  title,
  body,
  href,
  linkLabel,
}: {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-center" style={{ padding: "48px 16px" }}>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 11,
          color: "var(--fg-muted)",
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          color: "var(--fg-subtle)",
        }}
      >
        {body}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          color: "var(--primary)",
          marginTop: 8,
          textDecoration: "none",
        }}
      >
        {linkLabel}
        <ChevronRight className="w-3 h-3 shrink-0" strokeWidth={2} />
      </Link>
    </div>
  );
}

function PosterThumb({
  href,
  src,
  alt,
}: {
  href: string;
  src: string | null;
  alt: string;
}): React.JSX.Element {
  return (
    <Link
      href={href}
      className="relative shrink-0 overflow-hidden"
      style={{
        width: 32,
        aspectRatio: "2 / 3",
        borderRadius: 2,
        border: "1px solid var(--border)",
      }}
    >
      {src ? (
        <ImageWithFallback
          src={src}
          alt={alt}
          fill
          sizes="32px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: "var(--bg-elevated)" }} />
      )}
    </Link>
  );
}

export function ScheduleClient({
  upcoming,
  recent,
}: ScheduleClientProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view: ViewTab =
    searchParams.get("view") === "recent" ? "recent" : "upcoming";

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  function setView(next: ViewTab): void {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.replace(`/schedule?${params.toString()}`, { scroll: false });
  }

  const upcomingGrouped = useMemo(() => {
    const grouped = upcoming.reduce(
      (acc, item) => {
        const dateKey = toDate(item.airingAt).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      },
      {} as Record<string, UpcomingEpisode[]>,
    );
    return Object.entries(grouped);
  }, [upcoming]);

  const recentGrouped = useMemo(() => {
    const grouped = recent.reduce(
      (acc, item) => {
        const key = relativeGroup(toDate(item.releasedAt));
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, RecentRelease[]>,
    );
    return Object.entries(grouped);
  }, [recent]);

  const activeCount = view === "upcoming" ? upcoming.length : recent.length;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-5">
        <div>
          <h1 className="text-headline-lg font-display uppercase">SCHEDULE</h1>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        <button
          type="button"
          onClick={() => setView("upcoming")}
          style={{
            ...PILL_BASE,
            background: view === "upcoming" ? "var(--primary)" : "var(--bg-elevated)",
            color: view === "upcoming" ? "#fff" : "var(--fg-muted)",
            border: view === "upcoming" ? "none" : "1px solid var(--bg-card-high, #2a2a2d)",
          }}
        >
          UPCOMING
          <span style={{ fontSize: 9, opacity: 0.6 }}>{upcoming.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setView("recent")}
          style={{
            ...PILL_BASE,
            background: view === "recent" ? "var(--primary)" : "var(--bg-elevated)",
            color: view === "recent" ? "#fff" : "var(--fg-muted)",
            border: view === "recent" ? "none" : "1px solid var(--bg-card-high, #2a2a2d)",
          }}
        >
          RECENT RELEASES
          <span style={{ fontSize: 9, opacity: 0.6 }}>{recent.length}</span>
        </button>
      </div>

      {activeCount > 0 && activeCount < 3 && <SparseNote />}

      {view === "upcoming" ? (
        upcoming.length === 0 ? (
          <EmptyState
            title="No releases this week from your tracked titles."
            body="Add airing anime or manga to your tracker to see upcoming releases."
            href="/"
            linkLabel="Browse"
          />
        ) : (
          <div>
            {upcomingGrouped.map(([dateKey, items], groupIndex) => (
              <div key={dateKey}>
                <GroupLabel
                  label={dayLabel(toDate(items[0].airingAt))}
                  isFirst={groupIndex === 0}
                />
                {items.map((item, i) => {
                  const title = item.titleEnglish ?? item.title;
                  const airingAt = toDate(item.airingAt);
                  const countdown = formatCountdown(airingAt, now);
                  const showProgress =
                    item.userProgress > 0 && item.userProgress < item.nextEp - 1;
                  const isLast = i === items.length - 1;

                  return (
                    <div
                      key={`${item.animeId}-${item.nextEp}`}
                      className="flex items-center"
                      style={{
                        gap: 10,
                        padding: "8px 0",
                        borderBottom: isLast ? "none" : "1px solid var(--border)",
                      }}
                    >
                      <PosterThumb
                        href={`/anime/${item.animeId}`}
                        src={item.coverImage}
                        alt={title}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/anime/${item.animeId}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--fg)",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            display: "block",
                            textDecoration: "none",
                          }}
                        >
                          {title}
                        </Link>
                        <p
                          style={{
                            fontFamily: "var(--font-space-mono)",
                            fontSize: 9,
                            color: "var(--fg-muted)",
                            marginTop: 2,
                          }}
                        >
                          EP {item.nextEp}
                          {showProgress && (
                            <span style={{ color: "var(--fg-subtle)" }}>
                              {" "}
                              · you&apos;re on EP {item.userProgress}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className="shrink-0"
                        style={{
                          fontFamily: "var(--font-space-mono)",
                          fontSize: 9,
                          color: countdown.color,
                          textAlign: "right",
                        }}
                      >
                        {countdown.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )
      ) : recent.length === 0 ? (
        <EmptyState
          title="No releases in the last 14 days from your tracked titles."
          body="Add airing anime or manga to your tracker to see recent releases."
          href="/"
          linkLabel="Browse"
        />
      ) : (
        <div>
          {recentGrouped.map(([label, items], groupIndex) => (
            <div key={label}>
              <GroupLabel label={label} isFirst={groupIndex === 0} />
              {items.map((item, i) => {
                const title = item.titleEnglish ?? item.title;
                const releasedAt = toDate(item.releasedAt);
                const href =
                  item.mediaType === "ANIME"
                    ? `/anime/${item.mediaId}`
                    : `/manga/${item.mediaId}`;
                const kindLabel = item.mediaType === "ANIME" ? "EP" : "CH";
                const showProgress =
                  item.userProgress > 0 &&
                  item.userProgress < item.releaseNumber;
                const isLast = i === items.length - 1;

                return (
                  <div
                    key={`${item.mediaType}-${item.mediaId}-${item.releaseNumber}`}
                    className="flex items-center"
                    style={{
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                    }}
                  >
                    <PosterThumb
                      href={href}
                      src={item.coverImage}
                      alt={title}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={href}
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--fg)",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          display: "block",
                          textDecoration: "none",
                        }}
                      >
                        {title}
                      </Link>
                      <p
                        style={{
                          fontFamily: "var(--font-space-mono)",
                          fontSize: 9,
                          color: "var(--fg-muted)",
                          marginTop: 2,
                        }}
                      >
                        {kindLabel} {item.releaseNumber}
                        {showProgress && (
                          <span style={{ color: "var(--fg-subtle)" }}>
                            {" "}
                            · you&apos;re on {kindLabel} {item.userProgress}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className="shrink-0"
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 9,
                        color: "var(--fg-subtle)",
                        textAlign: "right",
                      }}
                    >
                      {daysAgo(releasedAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
