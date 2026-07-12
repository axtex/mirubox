import Link from "next/link";
import { Check } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import type { SeasonChallengeData } from "@/lib/season-challenge-types";
import { formatEarnedDate } from "@/lib/season-challenge-types";
import { formatSeasonLabel } from "@/lib/season";

export interface SeasonChallengeCardProps extends SeasonChallengeData {
  showSuggestions?: boolean;
  variant?: "home" | "stats";
}

function mediaTitle(anime: {
  title: string;
  titleEnglish: string | null;
}): string {
  return anime.titleEnglish ?? anime.title;
}

function CompletedThumbnail({
  id,
  title,
  coverImage,
}: {
  id: number;
  title: string;
  coverImage: string | null;
}): React.JSX.Element {
  return (
    <Link
      href={`/anime/${id}`}
      aria-label={title}
      style={{
        width: 40,
        height: 56,
        borderRadius: 2,
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid var(--bg-card)",
      }}
    >
      {coverImage ? (
        <ImageWithFallback
          src={coverImage}
          alt=""
          width={40}
          height={56}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="h-full w-full"
          style={{ background: "#1b1b1e" }}
        />
      )}
    </Link>
  );
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
          <ImageWithFallback
            src={coverImage}
            alt=""
            fill
            sizes="100px"
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

export function SeasonChallengeCard({
  season,
  label,
  emoji,
  target,
  count,
  isEarned,
  earnedAt,
  completedTitles,
  suggestions,
  xpReward,
  badgeLabel,
  showSuggestions = true,
  variant = "home",
}: SeasonChallengeCardProps): React.JSX.Element {
  const seasonName = formatSeasonLabel(season).toLowerCase();
  const progressPct = Math.min(100, Math.round((count / target) * 100));

  if (isEarned) {
    return (
      <section className="min-w-0">
        <div className="section-header">
          <div className="section-header-row">
            <h2 className="text-headline-md font-display uppercase">
              SEASON CHALLENGE
            </h2>
          </div>
          <div className="section-underline" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={14} strokeWidth={2.5} color="#1d9e75" aria-hidden />
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-muted)",
            }}
          >
            {emoji} {label}
            {variant === "stats" && earnedAt
              ? ` — earned ${formatEarnedDate(earnedAt)}`
              : " complete"}
          </span>
          {variant === "home" && (
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "var(--fg-subtle)",
              }}
            >
              {badgeLabel} earned
            </span>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="min-w-0">
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">
            SEASON CHALLENGE
          </h2>
          <span
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "#5a5a65",
              letterSpacing: "0.06em",
            }}
          >
            {emoji} {label}
          </span>
        </div>
        <div className="section-underline" />
      </div>

      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "#9e9ea8",
          margin: "0 0 10px",
        }}
      >
        Complete {target} {seasonName} anime to earn the {badgeLabel}. Only counts toward seasons from when you started tracking.
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 4,
            background: "#1f1f22",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 4,
              width: `${progressPct}%`,
              background: "#e8173f",
              borderRadius: 2,
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "#e4e1e6",
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {count} / {target}
        </span>
      </div>

      {count > 0 && completedTitles.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: showSuggestions && suggestions.length > 0 ? 12 : 0,
          }}
        >
          {completedTitles.slice(0, target).map((entry) => (
            <CompletedThumbnail
              key={entry.animeId}
              id={entry.anime.id}
              title={mediaTitle(entry.anime)}
              coverImage={entry.anime.coverImage}
            />
          ))}
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "#5a5a65",
              margin: "0 0 6px",
              letterSpacing: "0.06em",
            }}
          >
            Airing this season
          </p>
          <div className="section-cards">
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
          gap: 8,
          marginTop: 10,
          paddingTop: 10,
          borderTop: "1px solid #1f1f22",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "#e8173f",
          }}
        >
          +{xpReward} XP
        </span>
        <span style={{ color: "#3a3a45", fontSize: 9 }}>·</span>
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "#5a5a65",
          }}
        >
          {badgeLabel}
        </span>
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "#3a3a45",
          }}
        >
          on completion
        </span>
      </div>
    </section>
  );
}
