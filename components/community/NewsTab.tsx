import { ChevronRight } from "lucide-react";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { timeAgo } from "@/lib/time-ago";
import type { NewsArticle } from "@/lib/news-data";

export interface NewsTabProps {
  articles: NewsArticle[];
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function NewsSectionHeader({ title }: { title: string }): React.JSX.Element {
  return (
    <div className="section-header">
      <div className="section-header-row">
        <h2 className="text-headline-md font-display uppercase">{title}</h2>
      </div>
      <div className="section-underline" />
    </div>
  );
}

function HeadlineCard({ article }: { article: NewsArticle }): React.JSX.Element {
  const excerpt = article.excerpt
    ? article.excerpt.slice(0, 150).trim()
    : null;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 100,
          background: "var(--bg-elevated)",
          flexShrink: 0,
        }}
      >
        {article.imageUrl ? (
          <ImageWithFallback
            src={article.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 33vw, 280px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--fg)",
            lineHeight: 1.4,
            marginBottom: 5,
            marginTop: 0,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {article.title}
        </p>

        {excerpt ? (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 10,
              color: "var(--fg-muted)",
              lineHeight: 1.6,
              margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {excerpt}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 6,
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--fg-subtle)",
            }}
          >
            <span>ANN · {timeAgo(article.publishedAt)}</span>
          </div>
          <span
            className="hidden md:inline"
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 9,
              color: "var(--primary)",
              flexShrink: 0,
            }}
          >
            READ MORE
          </span>
        </div>
      </div>
    </a>
  );
}

function CompactNewsList({
  articles,
}: {
  articles: NewsArticle[];
}): React.JSX.Element {
  return (
    <div>
      {articles.map((article, i) => {
        const isLast = i === articles.length - 1;
        return (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 56,
              boxSizing: "border-box",
              padding: "0",
              borderBottom: isLast ? "none" : "1px solid var(--border)",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--fg)",
                  lineHeight: 1.4,
                  height: "2.8em",
                  margin: 0,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {article.title}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-space-mono)",
                  fontSize: 9,
                  color: "var(--fg-subtle)",
                  margin: "2px 0 0",
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                ANN · {timeAgo(article.publishedAt)}
              </p>
            </div>
            <ChevronRight
              size={12}
              strokeWidth={2}
              color="var(--fg-subtle)"
              style={{ flexShrink: 0 }}
              aria-hidden
            />
          </a>
        );
      })}
    </div>
  );
}

export function NewsTab({ articles }: NewsTabProps): React.JSX.Element {
  if (articles.length === 0) {
    return (
      <div>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-muted)",
            margin: 0,
          }}
        >
          News updates coming soon.
        </p>
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            color: "var(--fg-subtle)",
            marginTop: 4,
            marginBottom: 0,
          }}
        >
          Check back later — articles are fetched from Anime News Network.
        </p>
      </div>
    );
  }

  const topNews = articles.slice(0, 3);
  const rest = articles.slice(3);
  const todayNews = rest.filter((a) => isToday(a.publishedAt));
  const previousNews = rest.filter((a) => !isToday(a.publishedAt));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section>
        <NewsSectionHeader title="TOP NEWS" />
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "stretch",
          }}
        >
          {topNews.map((article) => (
            <HeadlineCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {todayNews.length > 0 || previousNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
          {todayNews.length > 0 ? (
            <section style={{ minWidth: 0 }}>
              <NewsSectionHeader title="TODAY" />
              <CompactNewsList articles={todayNews} />
            </section>
          ) : null}

          {previousNews.length > 0 ? (
            <section style={{ minWidth: 0 }}>
              <NewsSectionHeader title="MORE NEWS" />
              <CompactNewsList articles={previousNews} />
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function NewsTabSkeleton(): React.JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section>
        <div className="section-header">
          <div className="section-header-row">
            <div
              className="shimmer"
              style={{ height: 22, width: 120, borderRadius: 2 }}
            />
          </div>
          <div className="section-underline" />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div className="shimmer" style={{ width: "100%", height: 100 }} />
              <div style={{ padding: "10px 12px" }}>
                <div
                  className="shimmer"
                  style={{ height: 12, width: 28, borderRadius: 2, marginBottom: 8 }}
                />
                <div
                  className="shimmer"
                  style={{ height: 14, width: "90%", borderRadius: 2, marginBottom: 6 }}
                />
                <div
                  className="shimmer"
                  style={{ height: 10, width: "70%", borderRadius: 2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
        {Array.from({ length: 2 }, (_, col) => (
          <section key={col} style={{ minWidth: 0 }}>
            <div className="section-header">
              <div className="section-header-row">
                <div
                  className="shimmer"
                  style={{ height: 22, width: 80, borderRadius: 2 }}
                />
              </div>
              <div className="section-underline" />
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  height: 56,
                  borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    className="shimmer"
                    style={{ height: "2.8em", width: "85%", borderRadius: 2, marginBottom: 2 }}
                  />
                  <div
                    className="shimmer"
                    style={{ height: 9, width: 72, borderRadius: 2 }}
                  />
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
