"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import Link from "next/link";
import { getSeasonBrowseSearchHref } from "@/lib/season";
import { SEASON_CHALLENGE_SUGGESTIONS } from "@/lib/season-challenge-types";

export interface SeasonChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  emoji: string;
  label: string;
  season: string;
  year: number;
  target: number;
  count: number;
  isEarned: boolean;
  badgeLabel: string;
  xpReward: number;
  completedTitles: {
    id: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
  }[];
  suggestions: {
    id: number;
    title: string;
    titleEnglish: string | null;
    coverImage: string | null;
    averageScore: number | null;
  }[];
}

type TitleCardItem = {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  averageScore?: number | null;
};

function mediaTitle(anime: {
  title: string;
  titleEnglish: string | null;
}): string {
  return anime.titleEnglish ?? anime.title;
}

function TitleCard({
  id,
  title,
  coverImage,
  averageScore = null,
}: Pick<TitleCardItem, "id" | "title" | "coverImage" | "averageScore">): React.JSX.Element {
  const score =
    averageScore != null ? (averageScore / 10).toFixed(1) : null;

  return (
    <Link
      href={`/anime/${id}`}
      className="anime-card group relative"
      aria-label={title}
      style={{
        width: "100%",
        borderRadius: 4,
        border: "1px solid #1f1f22",
        overflow: "hidden",
      }}
    >
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        {coverImage ? (
          <ImageWithFallback
            src={coverImage}
            alt=""
            fill
            sizes="110px"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "#1b1b1e" }}
          />
        )}
        {score != null && (
          <span
            className="absolute top-1.5 right-1.5 leading-none font-bold pointer-events-none"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              background: "var(--primary)",
              color: "#fff",
              borderRadius: 2,
              padding: "2px 5px",
            }}
          >
            {score}
          </span>
        )}
      </div>
      <p
        className="anime-card-title"
        style={{
          fontSize: 10,
          lineHeight: 1.3,
          padding: "6px 4px 8px",
          margin: 0,
        }}
      >
        {title}
      </p>
    </Link>
  );
}

function TitleGridSection({
  label,
  titles,
  limit = 3,
  viewAllHref,
}: {
  label: string;
  titles: TitleCardItem[];
  limit?: number;
  viewAllHref?: string;
}): React.JSX.Element | null {
  const visible = titles.slice(0, limit);
  if (visible.length === 0) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          gap: 8,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "#5a5a65",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          {label}
        </p>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "#5a5a65",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            VIEW ALL
          </Link>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {visible.map((anime) => (
          <TitleCard
            key={anime.id}
            id={anime.id}
            title={mediaTitle(anime)}
            coverImage={anime.coverImage}
            averageScore={anime.averageScore ?? null}
          />
        ))}
      </div>
    </div>
  );
}

function RewardFooter({
  xpReward,
  badgeLabel,
}: {
  xpReward: number;
  badgeLabel: string;
}): React.JSX.Element {
  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: "1px solid #1f1f22",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "#5a5a65",
          margin: 0,
        }}
      >
        <span style={{ color: "#e8173f", fontWeight: 600 }}>+{xpReward} XP</span>
        {" · "}
        {badgeLabel} Badge
      </p>
    </div>
  );
}

export function SeasonChallengeModal({
  isOpen,
  onClose,
  emoji,
  label,
  season,
  year,
  target,
  count,
  isEarned,
  badgeLabel,
  xpReward,
  completedTitles,
  suggestions,
}: SeasonChallengeModalProps): React.JSX.Element | null {
  const overlayRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const progressPct = Math.min(100, Math.round((count / target) * 100));
  const headerTitle = `${emoji} ${label} Challenge`;

  const modal = (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={shellRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="season-challenge-modal-title"
        className="auth-modal-shell"
        style={{
          background: "#1b1b1e",
          border: "1px solid #2a2a2d",
          borderRadius: 2,
          width: "calc(100% - 32px)",
          maxWidth: 360,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "1px solid #1f1f22",
          }}
        >
          <h2
            id="season-challenge-modal-title"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e4e1e6",
              margin: 0,
            }}
          >
            {headerTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="review-modal-close"
          >
            ×
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {isEarned ? (
            <>
              <TitleGridSection
                label="Completed"
                titles={completedTitles}
                limit={target}
              />

              <RewardFooter xpReward={xpReward} badgeLabel={badgeLabel} />
            </>
          ) : (
            <>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#e4e1e6",
                  margin: "0 0 6px",
                }}
              >
                {count} / {target} completed
              </p>
              <div
                style={{
                  height: 6,
                  background: "#1f1f22",
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    height: 6,
                    width: `${progressPct}%`,
                    background: "linear-gradient(to right, #e8173f, #ff4455)",
                  }}
                />
              </div>

              <TitleGridSection
                label="Completed"
                titles={completedTitles}
                limit={target}
              />

              <TitleGridSection
                label="Airing this season"
                titles={suggestions}
                limit={SEASON_CHALLENGE_SUGGESTIONS}
                viewAllHref={getSeasonBrowseSearchHref(season, year)}
              />

              <RewardFooter xpReward={xpReward} badgeLabel={badgeLabel} />
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
