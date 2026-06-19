import Image from "next/image";
import Link from "next/link";
import { STATUS_COLORS } from "./types";
import type { EntryData } from "./types";

interface Props {
  entry: EntryData;
  showTypeChip?: boolean;
}

export function GridCard({ entry, showTypeChip = false }: Props) {
  const { animeId, anime, status, mediaType, progress } = entry;
  const title = anime.titleEnglish ?? anime.title;
  const dotColor = STATUS_COLORS[status] ?? "var(--fg-muted)";
  const isManga = mediaType === "MANGA";
  const href = isManga ? `/manga/${animeId}` : `/anime/${animeId}`;
  const total = entry.total ?? (isManga ? anime.chapters : anime.episodes);
  const progressPct = total ? Math.round((progress / total) * 100) : 0;

  return (
    <div
      className="group relative overflow-hidden min-w-0"
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {anime.coverImage ? (
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            sizes="(min-width: 768px) 15vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}

        <Link href={href} className="absolute inset-0 z-[1]" aria-label={`View ${title}`} />

        <div
          className="absolute bottom-2 left-2 z-[2] pointer-events-none"
          style={{
            background: dotColor,
            color: status === "PLANNED" ? "#000" : "#fff",
            padding: "2px 6px",
            borderRadius: 2,
            fontFamily: "var(--font-space-mono)",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          {status.replace(/_/g, " ")}
        </div>

        {status === "IN_PROGRESS" && total !== null && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
            style={{ height: 3, background: "rgba(0,0,0,0.45)" }}
          >
            <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--primary)" }} />
          </div>
        )}
      </div>

      <p
        className="tracker-card-title flex items-center gap-1.5 py-1.5 pr-1.5 pl-2.5 min-w-0"
        style={{ fontFamily: "var(--font-anybody)", fontSize: 12, lineHeight: 1.35, color: "var(--fg)" }}
      >
        <span className="truncate">{title}</span>
        {showTypeChip && (
          <span
            className="shrink-0"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: isManga ? "#a78bfa" : "#60a5fa",
              background: isManga ? "rgba(167,139,250,0.1)" : "rgba(96,165,250,0.1)",
              border: `1px solid ${isManga ? "rgba(167,139,250,0.2)" : "rgba(96,165,250,0.2)"}`,
              borderRadius: 2,
              padding: "1px 4px",
            }}
          >
            {isManga ? "MANGA" : "ANIME"}
          </span>
        )}
      </p>
    </div>
  );
}
