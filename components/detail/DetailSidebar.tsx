import { TrackerSidebarBlock } from "@/components/detail/TrackerSidebarBlock";
import {
  DetailSidebarMeta,
  type SidebarDetailsRow,
} from "@/components/detail/DetailSidebarMeta";
import type { StreamingLink } from "@/lib/streaming-links";

interface TrackerSidebarProps {
  mediaId: number;
  mediaType: "ANIME" | "MANGA";
  title: string;
  total: number | null;
  initialProgress: number;
  initialRating: number | null;
  initialReview: { content: string; containsSpoilers: boolean } | null;
}

interface DetailSidebarProps {
  tracker: TrackerSidebarProps;
  details: SidebarDetailsRow[];
  watchSection?: {
    title: string;
    links: StreamingLink[];
    isFallback: boolean;
    fallbackNote: string;
  };
  nextEpisodeLabel?: string | null;
}

export function DetailSidebar({
  tracker,
  details,
  watchSection,
  nextEpisodeLabel,
}: DetailSidebarProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <TrackerSidebarBlock {...tracker} />
      <DetailSidebarMeta
        details={details}
        watchSection={watchSection}
        nextEpisodeLabel={nextEpisodeLabel}
      />
    </div>
  );
}

export type { SidebarDetailsRow, TrackerSidebarProps };
