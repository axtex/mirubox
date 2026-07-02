"use client";

import { useState } from "react";
import Image from "next/image";
import type { CharacterEdge, VoiceActor } from "@/types/anilist";

interface VAEntry {
  va: VoiceActor;
  primaryChar: string;
  extraCount: number;
}

interface Props {
  chars: CharacterEdge[];
}

const CARD_W = 64;
const IMG_H = 80;

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function VACard({ entry }: { entry: VAEntry }) {
  const { va, primaryChar, extraCount } = entry;
  return (
    <div className="flex flex-col gap-1" style={{ width: CARD_W }}>
      <div
        className="relative overflow-hidden w-full shrink-0"
        style={{ height: IMG_H, borderRadius: 2, border: "1px solid #1f1f22" }}
      >
        {va.image.large ? (
          <Image
            src={va.image.large}
            alt={va.name.full ?? ""}
            fill
            sizes={`${CARD_W}px`}
            className="object-cover object-top"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "#1b1b1e" }}
          >
            <span
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: 12,
                color: "#3a3a45",
              }}
            >
              {getInitials(va.name.full)}
            </span>
          </div>
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
        {va.name.full}
      </p>
      <p
        className="truncate"
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: 7,
          color: "#5a5a65",
          maxWidth: CARD_W,
        }}
      >
        {primaryChar}
        {extraCount > 0 && ` +${extraCount}`}
      </p>
    </div>
  );
}

export function AnimeVASection({ chars }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Deduplicate VAs — same VA can voice multiple characters
  const vaMap = new Map<number, VAEntry>();
  for (const edge of chars) {
    const va = edge.voiceActors[0];
    if (!va) continue;
    if (vaMap.has(va.id)) {
      vaMap.get(va.id)!.extraCount += 1;
    } else {
      vaMap.set(va.id, {
        va,
        primaryChar: edge.node.name.full ?? "",
        extraCount: 0,
      });
    }
  }

  const vaList = Array.from(vaMap.values());
  if (vaList.length === 0) return null;

  const initial = vaList.slice(0, 8);
  const hasMore = vaList.length > 8;

  return (
    <section>
      <div className="flex items-baseline gap-2 mb-1.5">
        <p
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#5a5a65",
          }}
        >
          VOICE ACTORS
        </p>
        <span
          style={{
            fontFamily: "var(--font-space-mono)",
            fontSize: 8,
            color: "#3a3a45",
            letterSpacing: "0.06em",
          }}
        >
          JAPANESE
        </span>
      </div>

      {!showAll ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {initial.map((entry) => (
            <VACard key={entry.va.id} entry={entry} />
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
          {vaList.map((entry) => (
            <div key={entry.va.id} className="flex flex-col gap-1">
              <div
                className="relative overflow-hidden w-full"
                style={{ height: IMG_H, borderRadius: 2, border: "1px solid #1f1f22" }}
              >
                {entry.va.image.large ? (
                  <Image
                    src={entry.va.image.large}
                    alt={entry.va.name.full ?? ""}
                    fill
                    sizes="25vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "#1b1b1e" }}>
                    <span style={{ fontFamily: "var(--font-space-mono)", fontSize: 12, color: "#3a3a45" }}>
                      {getInitials(entry.va.name.full)}
                    </span>
                  </div>
                )}
              </div>
              <p className="truncate" style={{ fontFamily: "var(--font-space-mono)", fontSize: 9, color: "#e4e1e6", lineHeight: 1.3 }}>
                {entry.va.name.full}
              </p>
              <p className="truncate" style={{ fontFamily: "var(--font-space-mono)", fontSize: 7, color: "#5a5a65" }}>
                {entry.primaryChar}{entry.extraCount > 0 && ` +${entry.extraCount}`}
              </p>
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
          {showAll ? "SHOW LESS ↑" : `SHOW ALL (${vaList.length}) ↓`}
        </button>
      )}
    </section>
  );
}
