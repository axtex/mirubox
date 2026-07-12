"use client";

import { useMemo, useRef, useState } from "react";
import { ActivityFeedItem } from "@/components/activity/ActivityFeedItem";
import { SectionLabel } from "@/components/community/SectionLabel";
import type { FeedEntry } from "@/lib/community-feed";
import { BUCKET_ORDER, dateBucket } from "@/lib/activity-display";

interface ActivityFeedProps {
  initialFeed: FeedEntry[];
  initialHasMore: boolean;
  initialCursor: string | null;
  isFollowingAnyone: boolean;
  onFindSomeone?: () => void;
}

export function ActivityFeed({
  initialFeed,
  initialHasMore,
  initialCursor,
  isFollowingAnyone,
  onFindSomeone,
}: ActivityFeedProps): React.JSX.Element {
  const [feed, setFeed] = useState(initialFeed);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  const now = useRef(new Date()).current;

  const groups = useMemo(() => {
    const map = new Map<string, FeedEntry[]>();
    for (const item of feed) {
      const bucket = dateBucket(item.createdAt, now);
      const list = map.get(bucket) ?? [];
      list.push(item);
      map.set(bucket, list);
    }
    return map;
  }, [feed, now]);

  async function loadMore(): Promise<void> {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/community/feed?cursor=${encodeURIComponent(cursor)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        feed: FeedEntry[];
        hasMore: boolean;
        nextCursor: string | null;
      };
      setFeed((prev) => [...prev, ...data.feed]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <SectionLabel>ALL ACTIVITY</SectionLabel>

      {!isFollowingAnyone ? (
        <div style={{ padding: "16px 0" }}>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "#3a3a45",
              margin: 0,
            }}
          >
            Follow people to see their activity here.
          </p>
          {onFindSomeone ? (
            <button
              type="button"
              onClick={onFindSomeone}
              style={{
                marginTop: 8,
                padding: 0,
                border: "none",
                background: "none",
                fontFamily: "var(--font-space-mono)",
                fontSize: 10,
                color: "var(--primary)",
                cursor: "pointer",
              }}
            >
              Find someone →
            </button>
          ) : null}
        </div>
      ) : feed.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "#3a3a45",
            padding: "16px 0",
            margin: 0,
          }}
        >
          No recent activity from people you follow.
        </p>
      ) : (
        <div style={{ padding: "4px 0 0" }}>
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
                {items.map((item, i) => (
                  <ActivityFeedItem
                    key={item.id}
                    item={item}
                    user={item.user}
                    variant="social"
                    isLast={i === items.length - 1}
                  />
                ))}
              </div>
            );
          })}

          {hasMore ? (
            <div style={{ padding: "12px 0 4px", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loading}
                style={{
                  background: "none",
                  border: "1px solid var(--bg-card-high)",
                  borderRadius: 2,
                  padding: "8px 16px",
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "var(--fg-muted)",
                  cursor: loading ? "default" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
