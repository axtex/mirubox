"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

interface DescriptionToggleProps {
  description: string;
}

const SECTION_TITLE_STYLE = {
  fontFamily: "var(--font-space-mono)",
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#5a5a65",
};

export function DescriptionToggle({ description }: DescriptionToggleProps) {
  const [expanded, setExpanded] = useState(true);
  const isLong = description.length > 400;
  const displayed = expanded || !isLong ? description : description.slice(0, 400) + "…";

  return (
    <section>
      <div className="flex items-center justify-between mb-1.5">
        <p style={SECTION_TITLE_STYLE}>SYNOPSIS</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 transition-colors"
            aria-label={expanded ? "Show less" : "Expand"}
            aria-expanded={expanded}
          >
            {expanded ? (
              <Minus size={10} strokeWidth={2} style={{ color: "var(--accent)" }} />
            ) : (
              <Plus size={10} strokeWidth={2} style={{ color: "#5a5a65" }} />
            )}
          </button>
        )}
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--fg-muted)" }}
        dangerouslySetInnerHTML={{ __html: displayed }}
      />
    </section>
  );
}
