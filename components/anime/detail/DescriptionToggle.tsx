"use client";

import { useState } from "react";

interface DescriptionToggleProps {
  description: string;
}

export function DescriptionToggle({ description }: DescriptionToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > 400;
  const displayed = expanded || !isLong ? description : description.slice(0, 400) + "…";

  return (
    <div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--fg-muted)" }}
        dangerouslySetInnerHTML={{ __html: displayed }}
      />
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs mt-2 transition-colors"
          style={{ color: "var(--accent)" }}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
