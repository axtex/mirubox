"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import type { ReviewItem } from "@/lib/profile-types";

const PAGE_SIZE = 10;

interface ReviewsTabProps {
  reviews: ReviewItem[];
}

function Stars({ score }: { score: number }): React.JSX.Element {
  const filled = Math.round(score);
  return (
    <span style={{ display: "inline-flex", gap: 1 }} aria-label={`${score} out of 10`}>
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

export function ReviewsTab({ reviews }: ReviewsTabProps): React.JSX.Element {
  const [page, setPage] = useState(1);

  if (reviews.length === 0) {
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
          No ratings yet. Rate titles from your tracker.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(reviews.length / PAGE_SIZE);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = reviews.slice(start, start + PAGE_SIZE);

  return (
    <div style={{ padding: "16px 0" }}>
      {visible.map((item) => {
        const title = item.media.titleEnglish ?? item.media.title;
        const href =
          item.media.type === "MANGA"
            ? `/manga/${item.animeId}`
            : `/anime/${item.animeId}`;
        const meta = [item.media.format, item.media.seasonYear]
          .filter(Boolean)
          .join(" · ");
        const hasReview = !!item.review?.trim();

        if (!hasReview) {
          return (
            <Link
              key={item.animeId}
              href={href}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                background: "var(--bg-surface)",
                border: "1px solid var(--bg-card)",
                borderRadius: 2,
                overflow: "hidden",
                marginBottom: 6,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 50,
                  borderRadius: 2,
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--bg-elevated)",
                }}
              >
                {item.media.coverImage ? (
                  <ImageWithFallback
                    src={item.media.coverImage}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--fg)",
                    margin: 0,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </p>
                {meta ? (
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "var(--fg-subtle)",
                      margin: "2px 0 0",
                    }}
                  >
                    {meta}
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
                <Stars score={item.score} />
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    color: "var(--fg-subtle)",
                  }}
                >
                  {item.score} / 10
                </span>
              </div>
            </Link>
          );
        }

        return (
          <div
            key={item.animeId}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--bg-card)",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <Link
              href={href}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 50,
                  borderRadius: 2,
                  position: "relative",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--bg-elevated)",
                }}
              >
                {item.media.coverImage ? (
                  <ImageWithFallback
                    src={item.media.coverImage}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--fg)",
                    margin: 0,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {title}
                </p>
                {meta ? (
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "var(--fg-subtle)",
                      margin: "2px 0 0",
                    }}
                  >
                    {meta}
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
                <Stars score={item.score} />
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 9,
                    color: "var(--fg-subtle)",
                  }}
                >
                  {item.score} / 10
                </span>
              </div>
            </Link>

            <Link
              href={href}
              style={{
                display: "block",
                borderTop: "1px solid var(--bg-card)",
                padding: "8px 12px 10px",
                fontFamily: "var(--font-space-mono)",
                fontSize: 11,
                color: "var(--fg-muted)",
                lineHeight: 1.6,
                textDecoration: "none",
              }}
            >
              {item.review}
            </Link>

            {item.containsSpoilers ? (
              <Link
                href={href}
                style={{ display: "block", padding: "0 12px 8px", textDecoration: "none" }}
              >
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
              </Link>
            ) : null}
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
