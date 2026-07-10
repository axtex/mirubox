"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { XPAction } from "@prisma/client";
import type { ActivityItem } from "@/lib/profile-types";
import { timeAgo } from "@/lib/time-ago";

const PAGE_SIZE = 10;

interface ActivityTabProps {
  activity: ActivityItem[];
}

type IconStyle = {
  icon: string;
  bg: string;
  border: string;
};

function actionIcon(action: XPAction): IconStyle {
  switch (action) {
    case "ADD_TO_TRACKER":
    case "MARK_IN_PROGRESS":
    case "FIRST_TITLE":
      return {
        icon: "+",
        bg: "rgba(29,158,117,0.12)",
        border: "rgba(29,158,117,0.25)",
      };
    case "MARK_COMPLETED":
    case "MARK_COMPLETED_DIRECT":
    case "COMPLETE_MOVIE_OVA":
      return {
        icon: "✓",
        bg: "rgba(83,74,183,0.15)",
        border: "rgba(83,74,183,0.3)",
      };
    case "RATE_TITLE":
      return {
        icon: "★",
        bg: "rgba(232,23,63,0.1)",
        border: "rgba(232,23,63,0.2)",
      };
    case "WRITE_REVIEW":
      return {
        icon: "✍",
        bg: "rgba(186,117,23,0.1)",
        border: "rgba(186,117,23,0.2)",
      };
    case "BADGE_UNLOCKED":
      return {
        icon: "🏅",
        bg: "rgba(232,200,100,0.1)",
        border: "rgba(232,200,100,0.2)",
      };
    case "CREATE_LIST":
    case "ADD_TO_LIST":
      return {
        icon: "📋",
        bg: "rgba(100,180,230,0.1)",
        border: "rgba(100,180,230,0.2)",
      };
    case "DAILY_LOGIN":
      return {
        icon: "📅",
        bg: "rgba(100,180,230,0.1)",
        border: "rgba(100,180,230,0.2)",
      };
    default:
      return {
        icon: "·",
        bg: "var(--bg-elevated)",
        border: "var(--bg-card-high)",
      };
  }
}

function mediaTitle(item: ActivityItem): string | null {
  if (!item.media) return null;
  return item.media.titleEnglish ?? item.media.title;
}

function actionText(item: ActivityItem): { prefix: string; highlight: string | null; suffix?: string } {
  const title = mediaTitle(item);
  switch (item.action) {
    case "ADD_TO_TRACKER":
    case "FIRST_TITLE":
      return { prefix: "Added ", highlight: title, suffix: " to tracker" };
    case "MARK_IN_PROGRESS":
      return { prefix: "Started ", highlight: title };
    case "MARK_COMPLETED":
    case "MARK_COMPLETED_DIRECT":
    case "COMPLETE_MOVIE_OVA":
      return { prefix: "Completed ", highlight: title };
    case "RATE_TITLE":
      return { prefix: "Rated ", highlight: title };
    case "WRITE_REVIEW":
      return { prefix: "Wrote a review for ", highlight: title };
    case "BADGE_UNLOCKED":
      return { prefix: "Earned badge ", highlight: item.badgeName };
    case "CREATE_LIST":
      return { prefix: "Created list ", highlight: item.listTitle };
    case "ADD_TO_LIST":
      return { prefix: "Added ", highlight: title, suffix: item.listTitle ? ` to ${item.listTitle}` : " to a list" };
    case "DAILY_LOGIN":
      return { prefix: "Daily Login", highlight: null };
    default:
      return { prefix: item.action.replaceAll("_", " ").toLowerCase(), highlight: title };
  }
}

function subText(item: ActivityItem): string | null {
  const meta = item.meta;
  if (item.action === "MARK_IN_PROGRESS" || item.action === "ADD_TO_TRACKER") {
    const from = typeof meta?.from === "number" ? meta.from : null;
    const to = typeof meta?.to === "number" ? meta.to : typeof meta?.progress === "number" ? meta.progress : null;
    if (from != null && to != null) {
      const unit = item.media?.type === "MANGA" ? "CH" : "EP";
      return `${unit} ${from} → ${to}`;
    }
  }
  if (
    item.action === "MARK_COMPLETED" ||
    item.action === "MARK_COMPLETED_DIRECT" ||
    item.action === "COMPLETE_MOVIE_OVA"
  ) {
    const total = item.media?.type === "MANGA" ? item.media.chapters : item.media?.episodes;
    if (total) {
      const unit = item.media?.type === "MANGA" ? "chapters" : "episodes";
      return `${total} / ${total} ${unit}`;
    }
  }
  if (item.action === "RATE_TITLE") {
    const score = typeof meta?.score === "number" ? meta.score : null;
    if (score != null) return `${score} / 10`;
  }
  if (item.action === "BADGE_UNLOCKED" && item.badgeDescription) {
    return item.badgeDescription;
  }
  if ((item.action === "CREATE_LIST" || item.action === "ADD_TO_LIST") && item.listEntryCount != null) {
    const vis = item.listIsPublic ? "Public" : "Private";
    return `${item.listEntryCount} titles · ${vis}`;
  }
  return null;
}

function dateBucket(date: Date, now: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);

  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";
  if (diffDays < 7) return "THIS WEEK";
  if (diffDays < 30) return "THIS MONTH";
  return "EARLIER";
}

const BUCKET_ORDER = ["TODAY", "YESTERDAY", "THIS WEEK", "THIS MONTH", "EARLIER"];

export function ActivityTab({ activity }: ActivityTabProps): React.JSX.Element {
  const [page, setPage] = useState(1);

  if (activity.length === 0) {
    return (
      <div style={{ padding: "16px 0" }}>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-faint)",
            textAlign: "center",
            padding: "24px 0",
            margin: 0,
          }}
        >
          No activity yet. Start adding titles to your tracker.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(activity.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = activity.slice(start, start + PAGE_SIZE);

  const now = new Date();
  const groups = new Map<string, ActivityItem[]>();
  for (const item of visible) {
    const bucket = dateBucket(item.createdAt, now);
    const list = groups.get(bucket) ?? [];
    list.push(item);
    groups.set(bucket, list);
  }

  return (
    <div style={{ padding: "16px 0" }}>
      {BUCKET_ORDER.filter((b) => groups.has(b)).map((bucket, gi) => {
        const items = groups.get(bucket)!;
        return (
          <div key={bucket}>
            <p
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-faint)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: gi === 0 ? "0 0 4px" : "8px 0 4px",
                margin: 0,
              }}
            >
              {bucket}
            </p>
            {items.map((item, i) => {
              const style = actionIcon(item.action);
              const text = actionText(item);
              const sub = subText(item);
              const showPoster = !!item.media?.coverImage;
              const isLast = i === items.length - 1;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderBottom: isLast ? "none" : "1px solid #1a1a1d",
                  }}
                >
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
                      {text.prefix}
                      {text.highlight ? (
                        <span style={{ color: "var(--fg)", fontWeight: 500 }}>
                          {text.highlight}
                        </span>
                      ) : null}
                      {text.suffix ?? ""}
                    </p>
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
            })}
          </div>
        );
      })}

      {totalPages > 1 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 10,
            padding: "4px 0",
          }}
        >
          <button
            type="button"
            aria-label="Previous page"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="scroll-row-arrow"
          >
            <ChevronLeft size={12} strokeWidth={2} />
          </button>
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-muted)",
            }}
          >
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="scroll-row-arrow"
          >
            <ChevronRight size={12} strokeWidth={2} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
