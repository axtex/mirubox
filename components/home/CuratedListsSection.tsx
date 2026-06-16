import Link from "next/link";
import { List } from "lucide-react";

const CURATED_LISTS = [
  {
    title: "SLOW BURN MASTERPIECES",
    subtitle: "Drama · Character-driven",
    href: "/search?genre=Drama&sort=POPULARITY_DESC",
  },
  {
    title: "ADRENALINE RUSH",
    subtitle: "Action · High stakes",
    href: "/search?genre=Action&sort=TRENDING_DESC",
  },
  {
    title: "LATE NIGHT MOOD",
    subtitle: "Psychological · Mystery",
    href: "/search?genre=Psychological&sort=POPULARITY_DESC",
  },
  {
    title: "FEATURE FILMS",
    subtitle: "Anime movies · One sitting",
    href: "/search?format=MOVIE&sort=POPULARITY_DESC",
  },
] as const;

export function CuratedListsSection() {
  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">CURATED LISTS</h2>
          <span className="text-label" style={{ color: "var(--fg-subtle)" }}>
            EDITORIAL PICKS
          </span>
        </div>
        <div className="section-underline" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CURATED_LISTS.map((list) => (
          <Link
            key={list.title}
            href={list.href}
            className="card-base card-hover flex flex-col gap-3 p-5 min-h-[120px]"
          >
            <List className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
            <div>
              <p
                className="text-label leading-snug"
                style={{ color: "var(--fg)", fontSize: 10 }}
              >
                {list.title}
              </p>
              <p className="mt-1.5 text-label" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
                {list.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
