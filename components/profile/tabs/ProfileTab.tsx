"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { GenreBars } from "@/components/profile/GenreBars";
import { Top3PickerModal } from "@/components/profile/Top3PickerModal";
import type {
  BadgeDisplay,
  FavouriteSlot,
  GenreCount,
  ProfileMedia,
} from "@/lib/profile-types";
import type { AnimeCard as AnimeCardType } from "@/types/anilist";

interface ProfileTabProps {
  isOwnProfile: boolean;
  favouriteAnime: FavouriteSlot[];
  favouriteManga: FavouriteSlot[];
  tasteGenres: GenreCount[];
  badges: BadgeDisplay[];
}

function toAnimeCard(media: ProfileMedia): AnimeCardType {
  return {
    id: media.id,
    title: {
      romaji: media.title,
      english: media.titleEnglish,
      native: null,
    },
    coverImage: {
      large: media.coverImage,
      extraLarge: media.coverImage,
    },
    bannerImage: null,
    genres: [],
    episodes: media.episodes,
    chapters: media.chapters,
    status: null,
    season: null,
    seasonYear: media.seasonYear,
    averageScore: null,
    popularity: null,
    format: media.format,
    type: media.type,
    tags: [],
    rankings: [],
  };
}

function EmptyFavSlot({ isOwnProfile }: { isOwnProfile: boolean }): React.JSX.Element {
  return (
    <div
      className="anime-card"
      style={{
        width: "100%",
        borderRadius: 4,
        border: "1px solid #1f1f22",
        overflow: "hidden",
        background: "var(--bg-elevated)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="relative w-full aspect-[2/3] flex items-center justify-center"
        style={{ background: "var(--bg-elevated)" }}
      >
        {isOwnProfile ? (
          <Plus size={16} style={{ color: "var(--fg-faint)" }} aria-hidden />
        ) : null}
      </div>
    </div>
  );
}

function FavRow({
  items,
  isOwnProfile,
}: {
  items: FavouriteSlot[];
  isOwnProfile: boolean;
}): React.JSX.Element {
  const slots: (FavouriteSlot | null)[] = [...items.slice(0, 3)];
  while (slots.length < 3) slots.push(null);

  return (
    <div
      className="grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
      }}
    >
      {slots.map((slot, i) =>
        slot ? (
          <AnimeCard
            key={slot.mediaId}
            anime={toAnimeCard(slot.media)}
            size="sm"
            hideTitle
          />
        ) : (
          <EmptyFavSlot key={`empty-${i}`} isOwnProfile={isOwnProfile} />
        )
      )}
    </div>
  );
}

function SectionTitle({
  title,
  onEdit,
}: {
  title: string;
  onEdit?: () => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          color: "var(--fg-subtle)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          margin: 0,
        }}
      >
        {title}
      </p>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit"
          style={{
            color: "var(--primary)",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Pencil size={12} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function ProfileTab({
  isOwnProfile,
  favouriteAnime,
  favouriteManga,
  tasteGenres,
  badges,
}: ProfileTabProps): React.JSX.Element {
  const [animeSlots, setAnimeSlots] = useState(favouriteAnime);
  const [mangaSlots, setMangaSlots] = useState(favouriteManga);
  const [pickerType, setPickerType] = useState<"anime" | "manga" | null>(null);
  const unlocked = badges.filter((b) => b.earned);

  return (
    <div style={{ padding: "18px 20px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 0,
        }}
      >
        <section>
          <SectionTitle
            title="TOP 3 ANIME"
            onEdit={isOwnProfile ? () => setPickerType("anime") : undefined}
          />
          <FavRow items={animeSlots} isOwnProfile={isOwnProfile} />
        </section>

        <section>
          <SectionTitle
            title="TOP 3 MANGA"
            onEdit={isOwnProfile ? () => setPickerType("manga") : undefined}
          />
          <FavRow items={mangaSlots} isOwnProfile={isOwnProfile} />
        </section>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--bg-elevated)",
          margin: "16px 0",
        }}
      />

      {unlocked.length > 0 ? (
        <>
          <section>
            <SectionTitle title="BADGES" />
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                scrollbarWidth: "none",
              }}
              className="no-scrollbar"
            >
              {unlocked.map((badge) => (
                <div
                  key={badge.key}
                  title={badge.description}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(232,23,63,0.1)",
                      border: "1.5px solid rgba(232,23,63,0.4)",
                      fontSize: 16,
                    }}
                  >
                    {badge.emoji}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-space-mono)",
                      fontSize: 8,
                      textAlign: "center",
                      maxWidth: 52,
                      lineHeight: 1.3,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div
            style={{
              height: 1,
              background: "var(--bg-elevated)",
              margin: "16px 0",
            }}
          />
        </>
      ) : null}

      <section>
        <SectionTitle title="TASTE PROFILE" />
        <GenreBars genres={tasteGenres} />
      </section>

      {pickerType ? (
        <Top3PickerModal
          type={pickerType}
          initialSelected={
            pickerType === "anime"
              ? animeSlots.map((s) => s.mediaId)
              : mangaSlots.map((s) => s.mediaId)
          }
          onClose={() => setPickerType(null)}
          onSaved={(slots) => {
            if (pickerType === "anime") setAnimeSlots(slots);
            else setMangaSlots(slots);
          }}
        />
      ) : null}
    </div>
  );
}
