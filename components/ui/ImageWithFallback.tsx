"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "onError">;

/** next/image wrapper that swaps in a plain placeholder if the src 404s or fails to load. */
export function ImageWithFallback({ alt, className, style, ...props }: Props): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={props.fill ? className : undefined}
        style={{
          ...(props.fill ? { position: "absolute", inset: 0 } : { width: props.width, height: props.height }),
          background: "var(--bg-elevated)",
          ...style,
        }}
      />
    );
  }

  return (
    <Image
      {...props}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
