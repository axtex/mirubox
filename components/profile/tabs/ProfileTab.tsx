"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { GenreBars } from "@/components/profile/GenreBars";
import { Top3PickerModal } from "@/components/profile/Top3PickerModal";
import type {
  BadgeDisplay,
  FavouriteSlot,
  GenreCount,
  ProfileMedia,
} from "@/lib/profile-types";

interface ProfileTabProps {
  isOwnProfile: boolean;
  favouriteAnime: FavouriteSlot[];
  favouriteManga: FavouriteSlot[];
  tasteGenres: GenreCount[];
  badges: BadgeDisplay[];
  onFavouritesSaved?: (type: "anime" | "manga", slots: FavouriteSlot[]) => void;
}

function FavPoster({ media }: { media: ProfileMedia }): React.JSX.Element {
  const title = media.titleEnglish ?? media.title;
  const href = media.type === "MANGA" ? `/manga/${media.id}` : `/anime/${media.id}`;

  return (
    <Link
      href={href}
      prefetch
      aria-label={`View ${title}`}
      style={{
        width: "100%",
        borderRadius: 4,
        border: "1px solid #1f1f22",
        overflow: "hidden",
        background: "var(--bg-elevated)",
        display: "block",
        position: "relative",
        aspectRatio: "2 / 3",
      }}
    >
      {media.coverImage ? (
        <ImageWithFallback
          src={media.coverImage}
          alt={title}
          fill
          sizes="(max-width: 768px) 18vw, 160px"
          quality={90}
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <span style={{ fontSize: 24, opacity: 0.15 }}>✦</span>
        </div>
      )}
    </Link>
  );
}

function EmptyFavSlot({ isOwnProfile }: { isOwnProfile: boolean }): React.JSX.Element {
  return (
    <div
      style={{
        width: "100%",
        borderRadius: 4,
        border: "1px solid #1f1f22",
        overflow: "hidden",
        background: "var(--bg-elevated)",
        display: "flex",
        flexDirection: "column",
        aspectRatio: "2 / 3",
      }}
    >
      <div
        className="relative w-full h-full flex items-center justify-center"
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
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
      }}
    >
      {slots.map((slot, i) =>
        slot ? (
          <FavPoster key={slot.mediaId} media={slot.media} />
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
  onFavouritesSaved,
}: ProfileTabProps): React.JSX.Element {
  const [pickerType, setPickerType] = useState<"anime" | "manga" | null>(null);
  const unlocked = badges.filter((b) => b.earned);

  return (
    <div style={{ padding: "18px 0" }}>
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
          <FavRow items={favouriteAnime} isOwnProfile={isOwnProfile} />
        </section>

        <section>
          <SectionTitle
            title="TOP 3 MANGA"
            onEdit={isOwnProfile ? () => setPickerType("manga") : undefined}
          />
          <FavRow items={favouriteManga} isOwnProfile={isOwnProfile} />
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
              ? favouriteAnime.map((s) => s.mediaId)
              : favouriteManga.map((s) => s.mediaId)
          }
          onClose={() => setPickerType(null)}
          onSaved={(slots) => {
            onFavouritesSaved?.(pickerType, slots);
          }}
        />
      ) : null}
    </div>
  );
}
