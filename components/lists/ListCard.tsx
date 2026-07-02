import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";

export interface ListCardData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isOfficial: boolean;
  username: string | null;
  entryCount: number;
  likeCount: number;
  coverPosters: (string | null)[];
}

export function ListCard({ list }: { list: ListCardData }) {
  const posters = [...list.coverPosters].slice(0, 4);
  while (posters.length < 4) posters.push(null);

  return (
    <Link
      href={`/lists/${list.slug}`}
      style={{
        display: "block",
        background: "var(--bg-card)",
        border: "1px solid #1f1f22",
        borderRadius: 2,
        textDecoration: "none",
        transition: "border-color 0.15s ease",
        overflow: "hidden",
      }}
      className="list-card"
    >
      {/* Cover strip */}
      <div style={{ height: 80, display: "flex" }}>
        {posters.map((src, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              position: "relative",
              background: "var(--bg-card)",
              borderLeft: i > 0 ? "1px solid #0f0f12" : "none",
            }}
          >
            {src ? (
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              list.entryCount === 0 && i === 0 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <span style={{ color: "var(--fg-muted)", fontSize: 14 }}>✦</span>
                </div>
              ) : null
            )}
          </div>
        ))}
      </div>

      {/* Card info */}
      <div style={{ padding: "8px 10px 10px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#e4e1e6",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            {list.title}
          </span>
          {list.isOfficial && (
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "#e8173f",
                background: "rgba(232,23,63,0.1)",
                border: "1px solid rgba(232,23,63,0.2)",
                borderRadius: 2,
                padding: "1px 4px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              ✦ OFFICIAL
            </span>
          )}
        </div>

        {list.description && (
          <p
            style={{
              fontFamily: "var(--font-space-mono)",
              fontSize: 11,
              color: "var(--fg-muted)",
              lineHeight: 1.4,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {list.description}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            fontFamily: "var(--font-space-mono)",
            fontSize: 10,
            color: "var(--fg-muted)",
          }}
        >
          {!list.isOfficial && list.username && (
            <span>by {list.username}</span>
          )}
          <span>{list.entryCount} titles</span>
          <span>♥ {list.likeCount}</span>
        </div>
      </div>
    </Link>
  );
}

export function CreateListCard() {
  return (
    <Link
      href="/lists/new"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        border: "1px dashed #2a2a2d",
        borderRadius: 2,
        minHeight: 140,
        textDecoration: "none",
        transition: "border-color 0.15s ease, color 0.15s ease",
      }}
      className="create-list-card"
    >
      <Plus size={20} style={{ color: "var(--fg-muted)" }} />
      <span
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 10,
          color: "var(--fg-muted)",
          letterSpacing: "0.06em",
        }}
      >
        CREATE A LIST
      </span>
    </Link>
  );
}
