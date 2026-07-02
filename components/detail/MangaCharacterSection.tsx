"use client";

import { useState } from "react";
import Image from "next/image";
import type { CharacterEdge } from "@/types/anilist";

interface Props {
  chars: CharacterEdge[];
}

export function MangaCharacterSection({ chars }: Props) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? chars : chars.slice(0, 8);
  const hasMore = chars.length > 8;

  return (
    <section>
      <p
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#5a5a65",
          marginBottom: 6,
        }}
      >
        CHARACTERS
      </p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {displayed.map(({ node, role }) => (
          <div
            key={node.id}
            className="flex flex-col items-center gap-1 shrink-0"
            style={{ width: 72 }}
          >
            <div
              className="relative overflow-hidden w-full"
              style={{
                height: 80,
                borderRadius: 2,
                border: "1px solid #1f1f22",
              }}
            >
              {node.image.large ? (
                <Image
                  src={node.image.large}
                  alt={node.name.full ?? ""}
                  fill
                  sizes="72px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="w-full h-full" style={{ background: "#131316" }} />
              )}
            </div>
            <p
              className="truncate w-full text-center"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 9,
                color: "#9e9ea8",
                lineHeight: 1.3,
              }}
            >
              {node.name.full}
            </p>
            <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 7, color: "#5a5a65" }}>
              {role === "MAIN" ? "MAIN" : "SUP"}
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="btn-ghost w-full justify-center mt-1.5"
          style={{ fontSize: 10, padding: "6px 12px", minHeight: 32 }}
        >
          {showAll ? "SHOW LESS ↑" : `SHOW ALL (${chars.length}) ↓`}
        </button>
      )}
    </section>
  );
}
