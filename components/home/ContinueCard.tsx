import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { trackerProgressPct } from "@/lib/tracker-progress";

export interface ContinueItem {
  id: number;
  title: string;
  coverImage: string | null;
  href: string;
  progress: number;
  total: number | null;
  mediaType: "ANIME" | "MANGA";
}

interface ContinueCardProps {
  item: ContinueItem;
}

export function ContinueCard({ item }: ContinueCardProps): React.JSX.Element {
  const { title, coverImage, href, progress, total, mediaType } = item;
  const progressLabel = mediaType === "MANGA" ? "CH" : "EP";
  const progressText =
    total != null && total > 0
      ? `${progressLabel} ${progress}/${total}`
      : `${progressLabel} ${progress}`;
  const progressPct = trackerProgressPct(progress, total, mediaType);

  return (
    <Link href={href} className="continue-card" aria-label={`Continue ${title}`}>
      <div className="continue-card-cover">
        {coverImage ? (
          <ImageWithFallback
            src={coverImage}
            alt=""
            width={48}
            height={68}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="continue-card-cover-fallback" />
        )}
      </div>

      <div className="continue-card-body">
        <div className="continue-card-copy">
          <p className="continue-card-title">{title}</p>
          <p className="continue-card-progress">{progressText}</p>
        </div>
        <div className="continue-card-bar" aria-hidden="true">
          <div
            className="continue-card-bar-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
