import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ContinueItem } from "@/components/home/ContinueCard";
import { ContinueCardsRow } from "@/components/home/ContinueCardsRow";

interface ContinueCarouselProps {
  items: ContinueItem[];
}

export function ContinueCarousel({ items }: ContinueCarouselProps): React.JSX.Element {
  return (
    <section className="min-w-0">
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">CONTINUE</h2>
          <Link
            href="/tracker?status=in-progress"
            className="text-label inline-flex items-center gap-1 link-accent"
            style={{ color: "var(--primary)" }}
          >
            TRACKER
            <ChevronRight size={12} strokeWidth={2} color="var(--primary)" aria-hidden />
          </Link>
        </div>
        <div className="section-underline" />
      </div>

      <ContinueCardsRow items={items} />
    </section>
  );
}
