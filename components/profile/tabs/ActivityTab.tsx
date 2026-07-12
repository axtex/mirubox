"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ActivityItem } from "@/lib/profile-types";
import { ActivityFeedItem } from "@/components/activity/ActivityFeedItem";
import { BUCKET_ORDER, dateBucket } from "@/lib/activity-display";

const PAGE_SIZE = 10;

interface ActivityTabProps {
  activity: ActivityItem[];
}

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
            {items.map((item, i) => (
              <ActivityFeedItem
                key={item.id}
                item={item}
                variant="profile"
                isLast={i === items.length - 1}
              />
            ))}
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
