"use client";

import { useState } from "react";
import Image from "next/image";
import type { CharacterEdge } from "@/types/anilist";

interface Props {
  chars: CharacterEdge[];
}

const CARD_W = 64;
const IMG_H = 80;

function CharCard({ node, role }: { node: CharacterEdge["node"]; role: string }) {
  return (
    <div className="flex flex-col gap-1" style={{ width: CARD_W }}>
      <div
        className="relative overflow-hidden w-full shrink-0"
        style={{ height: IMG_H, borderRadius: 2, border: "1px solid #1f1f22" }}
      >
        {node.image.large ? (
          <Image
            src={node.image.large}
            alt={node.name.full ?? ""}
            fill
            sizes={`${CARD_W}px`}
            className="object-cover object-top"
          />
        ) : (
          <div className="w-full h-full" style={{ background: "#1b1b1e" }} />
        )}
      </div>
      <p
        className="truncate"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 9,
          color: "#e4e1e6",
          lineHeight: 1.3,
          maxWidth: CARD_W,
        }}
      >
        {node.name.full}
      </p>
      <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 7, color: "#5a5a65" }}>
        {role === "MAIN" ? "MAIN" : "SUP"}
      </span>
    </div>
  );
}

export function AnimeCharacterSection({ chars }: Props) {
  const [showAll, setShowAll] = useState(false);
  const initial = chars.slice(0, 8);
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

      {!showAll ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {initial.map(({ node, role }) => (
            <CharCard key={node.id} node={node} role={role} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "12px 8px",
          }}
        >
          {chars.map(({ node, role }) => (
            <div key={node.id} className="flex flex-col gap-1">
              <div
                className="relative overflow-hidden w-full"
                style={{ height: IMG_H, borderRadius: 2, border: "1px solid #1f1f22" }}
              >
                {node.image.large ? (
                  <Image
                    src={node.image.large}
                    alt={node.name.full ?? ""}
                    fill
                    sizes="25vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full" style={{ background: "#1b1b1e" }} />
                )}
              </div>
              <p
                className="truncate"
                style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#e4e1e6", lineHeight: 1.3 }}
              >
                {node.name.full}
              </p>
              <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 7, color: "#5a5a65" }}>
                {role === "MAIN" ? "MAIN" : "SUP"}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="btn-ghost w-full justify-center mt-1.5"
          style={{ fontSize: 9, padding: "6px 12px", minHeight: 30 }}
        >
          {showAll ? "SHOW LESS ↑" : `SHOW ALL (${chars.length}) ↓`}
        </button>
      )}
    </section>
  );
}
