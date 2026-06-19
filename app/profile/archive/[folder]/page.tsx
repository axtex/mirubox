import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import {
  ARCHIVE_FOLDER_META,
  getArchiveItems,
  isArchiveFolder,
  mediaHref,
  type ArchiveItem,
} from "@/lib/archive";

interface PageProps {
  params: Promise<{ folder: string }>;
}

function scoreLabel(score: number | null): string {
  if (!score) return "";
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export default async function ArchiveFolderPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");

  const { folder } = await params;
  if (!isArchiveFolder(folder)) notFound();

  const items = await getArchiveItems(session.user.id, folder);
  const { title } = ARCHIVE_FOLDER_META[folder];

  return (
    <div className="py-8" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-label mb-6 link-subtle"
        style={{ color: "var(--fg-subtle)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK TO PROFILE
      </Link>

      <div className="section-header mb-6">
        <div className="section-header-row">
          <h1 className="text-headline-lg font-display uppercase">{title}</h1>
          <span className="text-label" style={{ color: "var(--fg-subtle)" }}>
            {items.length} {items.length === 1 ? "TITLE" : "TITLES"}
          </span>
        </div>
        <div className="section-underline" />
      </div>

      {items.length === 0 ? (
        <p className="text-label" style={{ color: "var(--fg-subtle)" }}>NO TITLES YET</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {items.map((item) => (
            <ArchiveMediaCard key={`${item.anime.id}-${item.kind}`} item={item} folder={folder} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchiveMediaCard({
  item,
  folder,
}: {
  item: ArchiveItem;
  folder: string;
}) {
  const { anime } = item;
  const title = anime.titleEnglish ?? anime.title ?? "Unknown";
  const href = mediaHref(anime);
  const status = item.kind === "watchlist" ? item.status : null;
  const userScore = item.kind === "watchlist" ? item.userScore : item.score;
  const progress = item.kind === "watchlist" ? item.progress : 0;
  const progressPct =
    item.kind === "watchlist" && anime.episodes
      ? Math.round((progress / anime.episodes) * 100)
      : 0;

  return (
    <Link
      href={href}
      className="group block overflow-hidden transition-all"
      style={{ borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg-card)" }}
    >
      <div className="relative" style={{ aspectRatio: "2/3", overflow: "hidden" }}>
        {anime.coverImage ? (
          <Image
            src={anime.coverImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "var(--bg-elevated)" }} />
        )}

        {status && (
          <div
            className="absolute bottom-2 left-2 text-label"
            style={{
              background: "var(--bg-card-high)",
              color: "var(--fg-muted)",
              padding: "2px 6px",
              borderRadius: 2,
              fontSize: 8,
              border: "1px solid var(--border)",
            }}
          >
            {status.replace(/_/g, " ")}
          </div>
        )}
      </div>

      <div className="p-2">
        <p
          className="text-xs font-medium leading-snug line-clamp-2 mb-1"
          style={{ fontFamily: "var(--font-anybody)", color: "var(--fg)" }}
        >
          {title}
        </p>

        <div className="flex items-center justify-between gap-2">
          {userScore !== null && (
            <span className="text-label shrink-0" style={{ color: "var(--primary)", fontSize: 9 }}>
              YOU: {userScore.toFixed(1)}
            </span>
          )}
          {anime.averageScore !== null && folder !== "ratings" && (
            <span className={`score-badge ${scoreLabel(anime.averageScore)} shrink-0`}>
              ★ {anime.averageScore}
            </span>
          )}
        </div>

        {item.kind === "watchlist" && anime.episodes !== null && status === "IN_PROGRESS" && (
          <div className="w-full overflow-hidden mt-1.5" style={{ height: 2, background: "var(--bg-elevated)", borderRadius: 1 }}>
            <div className="h-full" style={{ width: `${progressPct}%`, background: "var(--secondary)", borderRadius: 1 }} />
          </div>
        )}
      </div>
    </Link>
  );
}
