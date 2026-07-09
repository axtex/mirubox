"use client";

import { useMemo } from "react";
import { Style, Avatar } from "@dicebear/core";
import type { StyleDefinition } from "@dicebear/core";
import definition from "@dicebear/styles/glyphs.json";

const glyphsStyle = new Style(definition as StyleDefinition);

interface Props {
  seed: string;
  size?: number;
  /** Fill a positioned parent (parent needs overflow:hidden + border-radius). */
  fill?: boolean;
}

export function AvatarGlyph({ seed, size = 56, fill = false }: Props): React.JSX.Element {
  const src = useMemo(() => {
    const avatar = new Avatar(glyphsStyle, {
      seed,
      size: size * 2,
      borderRadius: 0,
    });
    return avatar.toDataUri();
  }, [seed, size]);

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI from Dicebear
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          transform: "scale(1.08)",
          transformOrigin: "center center",
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI from Dicebear
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{ display: "block", width: size, height: size, borderRadius: 2 }}
    />
  );
}
