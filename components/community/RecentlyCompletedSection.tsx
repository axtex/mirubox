import Link from "next/link";
import type { RecentlyCompletedItem } from "@/lib/community-feed";
import { timeAgo } from "@/lib/time-ago";
import {
  CoverThumb,
  FriendsSection,
  InlineUserLabel,
  ReviewStars,
  mediaHref,
  mediaTitle,
} from "@/components/community/friends-shared";

interface RecentlyCompletedProps {
  items: RecentlyCompletedItem[];
}

export function RecentlyCompletedSection({
  items,
}: RecentlyCompletedProps): React.JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <FriendsSection label="RECENTLY COMPLETED">
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item, i) => {
          const href = mediaHref(item.media.type, item.media.id);
          const isLast = i === items.length - 1;

          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: isLast ? "none" : "1px solid #1a1a1d",
              }}
            >
              <CoverThumb
                src={item.media.coverImage}
                href={href}
                width={28}
                height={42}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <InlineUserLabel user={item.user} trailing="completed" />
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11,
                    color: "#e4e1e6",
                    fontWeight: 500,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  <Link
                    href={href}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {mediaTitle(item.media)}
                  </Link>
                </p>
                {item.rating != null ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 2,
                    }}
                  >
                    <ReviewStars score={item.rating} />
                    <span
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 9,
                        color: "#5a5a65",
                      }}
                    >
                      {item.rating}/10
                    </span>
                  </div>
                ) : null}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 8,
                  color: "#3a3a45",
                  flexShrink: 0,
                }}
              >
                {timeAgo(item.updatedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </FriendsSection>
  );
}
