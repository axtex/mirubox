import Image from "next/image";
import Link from "next/link";
import { STATUS_COLORS } from "./types";
import type { EntryData } from "./types";

interface Props {
  entry: EntryData;
}

export function GridCard({ entry }: Props) {
  const { animeId, anime, status, progress } = entry;
  const title = anime.titleEnglish ?? anime.title;
  const dotColor = STATUS_COLORS[status] ?? "var(--fg-muted)";
  const progressPct = anime.episodes ? Math.round((progress / anime.episodes) * 100) : 0;

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
            sizes="(max-width: 768px) 25vw, 15vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}

        <Link
          href={`/anime/${animeId}`}
          className="absolute inset-0 z-[1]"
          aria-label={`View ${title}`}
        />

        <div
          className="absolute bottom-2 left-2 z-[2] pointer-events-none"
          style={{
            background: dotColor,
            color: status === "PLAN_TO_WATCH" ? "#000" : "#fff",
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

        {status === "WATCHING" && anime.episodes !== null && (
          <div
            className="absolute bottom-0 left-0 right-0 z-[2] pointer-events-none"
            style={{ height: 3, background: "rgba(0,0,0,0.45)" }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "var(--primary)",
              }}
            />
          </div>
        )}
      </div>

      <p
        className="tracker-card-title py-1.5 pr-1.5 pl-2.5"
        style={{
          fontFamily: "var(--font-anybody)",
          fontSize: 12,
          lineHeight: 1.35,
          color: "var(--fg)",
        }}
      >
        {title}
      </p>
    </div>
  );
}
