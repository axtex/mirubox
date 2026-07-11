"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { formatSeasonLabel } from "@/lib/season";

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

function mediaTitle(anime: {
  title: string;
  titleEnglish: string | null;
}): string {
  return anime.titleEnglish ?? anime.title;
}

function SuggestionCard({
  id,
  title,
  coverImage,
  averageScore,
}: {
  id: number;
  title: string;
  coverImage: string | null;
  averageScore: number | null;
}): React.JSX.Element {
  const score =
    averageScore != null ? (averageScore / 10).toFixed(1) : null;

  return (
    <Link
      href={`/anime/${id}`}
      className="anime-card anime-card--sm group relative"
      aria-label={title}
      style={{
        borderRadius: 4,
        border: "1px solid #1f1f22",
        overflow: "hidden",
      }}
    >
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            sizes="100px"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "var(--bg-elevated)" }}
          />
        )}
        {score != null && (
          <span
            className="absolute top-1.5 right-1.5"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg)",
              background: "rgba(0,0,0,0.65)",
              padding: "2px 4px",
              borderRadius: 2,
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

export function SeasonChallengeModal({
  isOpen,
  onClose,
  emoji,
  label,
  season,
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

  const seasonName = formatSeasonLabel(season).toLowerCase();
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
            style={{
              fontSize: 16,
              color: "#3a3a45",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
            className="hover:text-[#9e9ea8]"
          >
            ×
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {isEarned ? (
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <Check
                size={28}
                strokeWidth={2}
                color="#1d9e75"
                style={{ margin: "0 auto 10px", display: "block" }}
                aria-hidden
              />
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#e4e1e6",
                  margin: "0 0 6px",
                }}
              >
                {emoji} {label} Challenge
              </p>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "#5a5a65",
                  margin: 0,
                }}
              >
                {badgeLabel} earned
              </p>
            </div>
          ) : (
            <>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 10,
                  color: "#9e9ea8",
                  lineHeight: 1.6,
                  margin: "0 0 14px",
                }}
              >
                Complete {target} {seasonName} anime to earn the {badgeLabel}. Only seasons from when you started tracking count.
              </p>

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
                  borderRadius: 2,
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    height: 6,
                    width: `${progressPct}%`,
                    background: "linear-gradient(to right, #e8173f, #ff4455)",
                    borderRadius: 2,
                  }}
                />
              </div>

              {count > 0 && completedTitles.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "#5a5a65",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      margin: "0 0 6px",
                    }}
                  >
                    Completed
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {completedTitles.slice(0, target).map((anime) => (
                      <Link
                        key={anime.id}
                        href={`/anime/${anime.id}`}
                        aria-label={mediaTitle(anime)}
                        style={{
                          width: 40,
                          aspectRatio: "2/3",
                          borderRadius: 2,
                          overflow: "hidden",
                          flexShrink: 0,
                          border: "1px solid var(--bg-card)",
                        }}
                      >
                        {anime.coverImage ? (
                          <Image
                            src={anime.coverImage}
                            alt=""
                            width={40}
                            height={60}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{ background: "var(--bg-elevated)" }}
                          />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 9,
                      color: "#5a5a65",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      margin: "0 0 6px",
                    }}
                  >
                    Airing this season
                  </p>
                  <div
                    className="section-cards no-scrollbar"
                    style={{ paddingBottom: 4 }}
                  >
                    {suggestions.map((anime) => (
                      <SuggestionCard
                        key={anime.id}
                        id={anime.id}
                        title={mediaTitle(anime)}
                        coverImage={anime.coverImage}
                        averageScore={anime.averageScore}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: "1px solid #1f1f22",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    color: "#e8173f",
                    fontWeight: 600,
                  }}
                >
                  +{xpReward} XP
                </span>
                <span style={{ color: "#3a3a45", fontSize: 10 }}>·</span>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    color: "#5a5a65",
                  }}
                >
                  {badgeLabel}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontSize: 10,
                    color: "#3a3a45",
                  }}
                >
                  on completion
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
