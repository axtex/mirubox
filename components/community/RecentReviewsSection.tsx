import Link from "next/link";
import type { FriendsReviewItem } from "@/lib/community-feed";
import { timeAgo } from "@/lib/time-ago";
import {
  CoverThumb,
  FriendsSection,
  InlineUserLabel,
  ReviewStars,
  mediaHref,
  mediaTitle,
} from "@/components/community/friends-shared";

interface RecentReviewsProps {
  items: FriendsReviewItem[];
}

export function RecentReviewsSection({
  items,
}: RecentReviewsProps): React.JSX.Element {
  return (
    <FriendsSection label="RECENT REVIEWS">
      {items.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "#3a3a45",
            margin: 0,
            padding: "8px 0",
          }}
        >
          No recent ratings from people you follow.
        </p>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const href = mediaHref(item.media.type, item.media.id);
          const reviewsHref = item.user.username
            ? `/u/${item.user.username}?tab=reviews`
            : href;
          const meta = [item.media.type, item.media.seasonYear]
            .filter(Boolean)
            .join(" · ");
          const reviewContent = item.content?.trim() ? item.content : null;
          const truncated =
            reviewContent != null && reviewContent.length > 120;
          const excerpt = truncated
            ? `${reviewContent.slice(0, 120)}...`
            : reviewContent;

          return (
            <div
              key={item.id}
              style={{
                background: "#131316",
                border: "1px solid #1f1f22",
                borderRadius: 2,
                overflow: "hidden",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InlineUserLabel user={item.user} />
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
                  {meta ? (
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 9,
                        color: "#5a5a65",
                      }}
                    >
                      {meta}
                    </p>
                  ) : null}
                </div>
                <CoverThumb
                  src={item.media.coverImage}
                  href={href}
                  width={36}
                  height={54}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: reviewContent != null ? 6 : 0,
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
                  {item.rating} / 10
                </span>
              </div>

              {reviewContent != null ? (
                <p
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 11,
                    color: "#9e9ea8",
                    lineHeight: 1.6,
                  }}
                >
                  {excerpt}
                  {truncated ? (
                    <>
                      {" "}
                      <Link
                        href={reviewsHref}
                        style={{
                          fontFamily: "var(--font-space-mono)",
                          fontSize: 9,
                          color: "var(--primary)",
                          textDecoration: "none",
                        }}
                      >
                        read more →
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : null}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "1px solid #1f1f22",
                }}
              >
                <div>
                  {item.containsSpoilers ? (
                    <span
                      style={{
                        fontFamily: "var(--font-space-mono)",
                        fontSize: 8,
                        color: "var(--primary)",
                        background: "rgba(232,23,63,0.08)",
                        border: "1px solid rgba(232,23,63,0.2)",
                        padding: "1px 5px",
                        borderRadius: 2,
                      }}
                    >
                      SPOILER
                    </span>
                  ) : null}
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 8,
                    color: "#3a3a45",
                  }}
                >
                  {timeAgo(item.updatedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </FriendsSection>
  );
}
